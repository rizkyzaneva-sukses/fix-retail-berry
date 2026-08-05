# Strawberry Fresh Supply — PRD Teknis (Rebuild)

**Sumber analisis:** source code asli `strawberry_app` (Streamlit/Python), dibaca langsung dari `database.py`, `auth_utils.py`, `ui_theme.py`, `waha_utils.py`, `app.py`/`Dashboard.py`, dan seluruh 12 file di `pages/`.
**Target stack rebuild:** Next.js (App Router, TypeScript) + PostgreSQL + Prisma.
**Prinsip utama:** **simpel dan mudah dipakai** — setiap keputusan desain di dokumen ini memilih alur yang paling sedikit langkah & paling sedikit field untuk user, selama tidak mengorbankan akurasi data.

---

## 0. Ringkasan Eksekutif

Aplikasi internal manajemen rantai pasok & penjualan strawberry:

```
Kebun → Pickup (SJ) → Penerimaan & Sortir → Stok → Produk → Order/Penjualan → Pengiriman → Keuangan
```

dengan dashboard per role, workflow approval, dan audit log penuh. Versi saat ini di **Streamlit**, akan di-rebuild total ke **Next.js + PostgreSQL + Prisma**.

### Kenapa rebuild — keterbatasan versi lama yang wajib hilang

| # | Masalah | Akar penyebab di source lama | Requirement versi baru |
|---|---|---|---|
| 1 | **UI selalu berkedip** saat pindah halaman | Streamlit multipage = full script rerun tiap navigasi | Client-side navigation (App Router) + skeleton loading, tanpa full reload |
| 2 | **UX kurang nyaman** | Semua styling di-force lewat CSS injection (`ui_theme.py` 700+ baris `!important`), modal disimulasikan pakai session-state flag + rerun | Design system asli (Tailwind + shadcn/ui), komponen native (dialog, combobox, toast) |
| 3 | **Cari Surat Jalan ribet** — cuma dropdown polos ATAU ketik manual, dipisah radio button | `pages/2_⚖️_Penerimaan_Sortir.py` | **Satu combobox search-as-you-type** — ketik sebagian nomor SJ / nama kebun / hasil scan, langsung terfilter |
| 4 | **Concurrency lemah** | Anti-double-submit cuma `st.session_state["recv_lock"]` (per browser, bukan per DB) | Transaction + unique constraint di level database |
| 5 | **Login tidak persist** | Auth cuma `st.session_state.user`, tidak ada cookie/JWT | Session cookie httpOnly yang benar-benar persist |
| 6 | **Data lama "hilang" diam-diam** | Semua list hard-limit 100/300/500 baris terakhir, tanpa pagination | Pagination / infinite scroll asli |

### Scope
- **Fase 1 (§1–§12):** parity seluruh fitur existing + perbaikan gap + 2 fitur baru yang sudah disepakati (toleransi susut & harga beli per kebun).
- **Fase 2 (§13):** roadmap lanjutan.

---

## 1. Perbandingan Tech Stack

| Layer | Versi Lama | Versi Baru |
|---|---|---|
| Framework | Streamlit multipage (Python 3.11) | Next.js 14+ App Router, TypeScript |
| Database | SQLite (dev) / PostgreSQL (prod) | PostgreSQL saja (drop dual-support) |
| ORM | SQLAlchemy 2.x | Prisma |
| Auth | `st.session_state` + bcrypt | NextAuth Credentials / iron-session, cookie httpOnly + bcryptjs |
| Styling | CSS injection `unsafe_allow_html` | Tailwind CSS + shadcn/ui (Radix) |
| Mutasi data | Full-page Python rerun | Server Actions + React Query untuk client state |
| Validasi | Manual if/else | Zod + React Hook Form (schema dipakai bersama client & server) |
| File upload | Disk lokal `uploads/` | S3-compatible object storage (R2/S3/MinIO) |
| PDF Invoice | `reportlab` (A5) | `@react-pdf/renderer` |
| QR Code | `qrcode[pil]` | `qrcode` (npm) |
| Export | `openpyxl` / pandas | `exceljs` / CSV builder |
| Chart | `st.line_chart` / `st.bar_chart` | Recharts |
| WhatsApp | WAHA via `requests` | WAHA via `fetch` — **infra WAHA tidak berubah** |
| Tema | localStorage + custom JS injection | `next-themes` (native, tanpa flicker) |
| Deploy | Docker `streamlit run app.py` | Docker Next.js standalone / Vercel |

---

## 2. Database Schema

Notasi Prisma, siap jadi acuan `schema.prisma`. Field ditulis camelCase (database baru dari kosong — tidak perlu `@map` ke kolom snake_case lama).

### 2.1 Enum

```prisma
enum Role {
  owner    // digabung dari owner+admin versi lama — lihat §3
  driver
  sorter
  sales
}

enum PickupStatus { pending  received  cancelled }

enum SaleStatus {
  confirmed   // "Dipesan" — titik awal semua order baru
  shipped     // "Pesanan Terkirim"
  delivered
  cancelled
}
// CATATAN: status `draft` dari versi lama DIHAPUS (dead code, tidak pernah dipakai order baru)

enum MovementType { in_sorting  out_sale  adjustment  in_return }

enum ShippingPayer {
  buyer_direct   // Buyer bayar langsung ke kurir
  seller_billed  // Seller talangi, ditagih ke buyer lewat invoice
  seller_free    // Free ongkir — beban toko
}

enum ApprovalStatus { pending  approved  rejected }
```

### 2.2 Model inti

```prisma
model User {
  id           Int      @id @default(autoincrement())
  name         String
  username     String   @unique
  passwordHash String
  role         Role     @default(driver)
  phone        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  pickups      Pickup[]
  sales        Sale[]
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique          // JUMBO, B, AB MIX
  description String?
  color       String   @default("#e11d48")
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  // BARU — toleransi susut saat packing ke konsumen (§5.3)
  shrinkagePct Float   @default(0)      // mis. 2 = lebihkan 2% saat potong stok
  createdAt   DateTime @default(now())
  sortingDetails SortingDetail[]
  recipeItems    ProductRecipe[]
  movements      InventoryMovement[]
  returnItems    ReturnItem[]
  farmPrices     FarmCategoryPrice[]
}

model Farm {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  code      String   @unique            // max 10 char, auto-uppercase — dipakai di nomor SJ
  location  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  prices    FarmCategoryPrice[]
  pickups   Pickup[]
}

// BARU — harga beli per kebun per kategori, dengan riwayat (§5.4)
model FarmCategoryPrice {
  id            Int      @id @default(autoincrement())
  farmId        Int
  farm          Farm     @relation(fields: [farmId], references: [id])
  categoryId    Int
  category      Category @relation(fields: [categoryId], references: [id])
  pricePerKg    Float
  effectiveFrom DateTime @db.Date       // harga berlaku mulai tanggal ini
  createdBy     String?
  createdAt     DateTime @default(now())

  @@unique([farmId, categoryId, effectiveFrom])
  @@index([farmId, categoryId, effectiveFrom])
}

model Pickup {
  id          Int          @id @default(autoincrement())
  driverId    Int
  driver      User         @relation(fields: [driverId], references: [id])
  farmId      Int                        // DIPERBAIKI: dulu farmName string bebas
  farm        Farm         @relation(fields: [farmId], references: [id])
  pickupDate  DateTime     @db.Date
  trayCount   Int
  photoUrl    String?
  sjNumber    String       @unique
  barcodeData String?
  notes       String?
  status      PickupStatus @default(pending)
  createdAt   DateTime     @default(now())
  receiving   Receiving?

  // Aturan bisnis: 1 kebun = 1 pickup per hari (status aktif)
  @@index([farmId, pickupDate])
}

model Receiving {
  id             Int      @id @default(autoincrement())
  pickupId       Int      @unique        // DB-level guard: 1 SJ = 1 penerimaan
  pickup         Pickup   @relation(fields: [pickupId], references: [id])
  totalKg        Float
  checkedById    Int?
  checkedByName  String?
  checkDate      DateTime @default(now())
  notes          String?
  isBalanced     Boolean  @default(false)
  photoUrl       String?
  totalCost      Float    @default(0)    // BARU: total biaya beli, snapshot dari FarmCategoryPrice
  createdAt      DateTime @default(now())
  sortingDetails SortingDetail[]
}

model SortingDetail {
  id          Int       @id @default(autoincrement())
  receivingId Int
  receiving   Receiving @relation(fields: [receivingId], references: [id], onDelete: Cascade)
  categoryId  Int
  category    Category  @relation(fields: [categoryId], references: [id])
  kg          Float
  percentage  Float?                     // kg / totalKg * 100
  unitCost    Float     @default(0)      // BARU: snapshot harga beli/kg saat penerimaan
  totalCost   Float     @default(0)      // BARU: kg × unitCost
}

model InventoryMovement {
  id           Int          @id @default(autoincrement())
  categoryId   Int
  category     Category     @relation(fields: [categoryId], references: [id])
  movementType MovementType
  qtyKg        Float                     // positif = masuk, negatif = keluar
  refType      String?                   // "receiving" | "sale" | "adjustment" | "transfer" | "return"
  refId        Int?
  notes        String?
  createdAt    DateTime     @default(now())
  createdById  Int?
  createdByName String?

  @@index([categoryId])
  @@index([refType, refId])
}

model Product {
  id             Int             @id @default(autoincrement())
  name           String          @unique
  productType    String          @default("pure")   // "pure" | "mixed"
  basePrice      Float           @default(0)
  description    String?
  imageUrl       String?
  approvalStatus ApprovalStatus  @default(approved)
  isActive       Boolean         @default(true)
  createdBy      String?
  createdAt      DateTime        @default(now())
  recipes        ProductRecipe[]
  saleItems      SaleItem[]
}

model ProductRecipe {
  id         Int      @id @default(autoincrement())
  productId  Int
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])
  ratio      Float                       // WAJIB: total ratio per produk = 1.0 (§5.2)

  @@unique([productId, categoryId])
}

model Customer {
  id                 Int      @id @default(autoincrement())
  name               String
  phone              String?
  address            String?
  notes              String?
  defaultDiscountPct Float    @default(0)
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  sales              Sale[]
}

model Sale {
  id             Int           @id @default(autoincrement())
  customerId     Int
  customer       Customer      @relation(fields: [customerId], references: [id])
  saleDate       DateTime      @db.Date
  subtotal       Float         @default(0)
  discountAmount Float         @default(0)
  shippingMethod String?                  // GO SEND | Paxel | Kurir Sendiri | Mobil Box Sewa
  shippingPayer  ShippingPayer @default(buyer_direct)   // DISEDERHANAKAN dari 2 field jadi 1 (§5.1)
  shippingCost   Float         @default(0)
  totalAmount    Float         @default(0)
  totalCogs      Float         @default(0)              // BARU: HPP snapshot (§5.4)
  status         SaleStatus    @default(confirmed)
  notes          String?
  invoiceNumber  String?       @unique
  createdById    Int?
  createdByUser  User?         @relation(fields: [createdById], references: [id])
  createdAt      DateTime      @default(now())
  shippedAt      DateTime?
  items          SaleItem[]
  returns        ReturnOrder[]
  expenses       Expense[]

  @@index([saleDate, status])
}

model SaleItem {
  id        Int     @id @default(autoincrement())
  saleId    Int
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  qtyKg     Float                        // qty yang ditagih ke customer
  unitPrice Float
  subtotal  Float
}

model Expense {
  id                Int        @id @default(autoincrement())
  expenseDate       DateTime   @db.Date
  categoryId        Int
  category          ExpenseCategory @relation(fields: [categoryId], references: [id])
  amount            Float
  description       String?
  relatedSaleId     Int?
  relatedSale       Sale?      @relation(fields: [relatedSaleId], references: [id])
  relatedReceivingId Int?                // BARU: link ke pembelian kebun
  isAutoGenerated   Boolean    @default(false)  // BARU: dibuat sistem, bukan input manual
  createdById       Int?
  createdByName     String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([expenseDate])
}

model ExpenseCategory {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  icon      String    @default("💰")
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)
  isSystem  Boolean   @default(false)    // BARU: kategori sistem (Ongkir, Pembelian Kebun) tidak bisa dihapus
  createdAt DateTime  @default(now())
  expenses  Expense[]
}

model Setting {
  key   String @id
  value String?
}

model ActivityLog {
  id         Int      @id @default(autoincrement())
  createdAt  DateTime @default(now())
  userId     Int?
  username   String?
  userName   String?
  role       String?
  action     String                       // "pickup.edit", "sale.create", dst — §4.11
  entityType String?
  entityId   Int?
  summary    String
  detail     Json?                        // DIPERBAIKI: dulu string JSON, sekarang kolom Json native
  @@index([createdAt])
  @@index([action])
}

model ChangeRequest {
  id              Int            @id @default(autoincrement())
  entityType      String                   // "pickup" | "stock_adjustment"
  entityId        Int
  requestType     String                   // "edit" | "cancel" | "adjust"
  payload         Json?
  reason          String
  status          ApprovalStatus @default(pending)
  requestedById   Int
  requestedByName String?
  reviewedById    Int?
  reviewedByName  String?
  reviewNote      String?
  createdAt       DateTime       @default(now())
  reviewedAt      DateTime?
}

model ReturnOrder {
  id             Int            @id @default(autoincrement())
  saleId         Int
  sale           Sale           @relation(fields: [saleId], references: [id])
  returnDate     DateTime       @db.Date
  reason         String
  status         ApprovalStatus @default(pending)
  createdById    Int?
  createdByName  String?
  reviewedById   Int?
  reviewedByName String?
  reviewNote     String?
  createdAt      DateTime       @default(now())
  reviewedAt     DateTime?
  items          ReturnItem[]
}

model ReturnItem {
  id          Int         @id @default(autoincrement())
  returnId    Int
  returnOrder ReturnOrder @relation(fields: [returnId], references: [id], onDelete: Cascade)
  categoryId  Int
  category    Category    @relation(fields: [categoryId], references: [id])
  qtyKg       Float
  notes       String?
}

model Permission {
  id         Int     @id @default(autoincrement())
  role       Role
  module     String
  canView    Boolean @default(false)
  canCreate  Boolean @default(false)
  canEdit    Boolean @default(false)
  canDelete  Boolean @default(false)
  canApprove Boolean @default(false)

  @@unique([role, module])
}
```

### 2.3 Prinsip data yang wajib dipertahankan

**Stok TIDAK disimpan sebagai kolom running-balance.** Stok per kategori selalu dihitung live: `SUM(InventoryMovement.qtyKg) GROUP BY categoryId`. Ledger `InventoryMovement` adalah satu-satunya sumber kebenaran — jangan didenormalisasi jadi kolom stok di `Category` (rawan drift). Kalau nanti volume data besar, optimasi lewat materialized view / cache, bukan lewat kolom yang di-update manual.

---

## 3. Autentikasi & Otorisasi

- **Password:** bcrypt (`bcryptjs` di Node kompatibel dengan hash lama). **Minimal 8 karakter** (versi lama cuma 4).
- **Session:** cookie httpOnly, persist beneran.
- **Role digabung jadi 4:** `owner`, `driver`, `sorter`, `sales`. Role `admin` versi lama **dihapus** — di seluruh source lama `admin` 100% identik dengan `owner` (`is_owner = role in ("owner","admin")` di semua halaman), jadi memisahkannya cuma menambah kebingungan tanpa manfaat.
- **Ganti password wajib menulis Activity Log** (di versi lama ini satu-satunya mutasi yang tidak ter-audit).

### RBAC: satu mekanisme saja

Versi lama punya **dua** sistem otorisasi yang tumpang tindih: role-list hardcoded per halaman (yang benar-benar jalan) dan tabel `Permission` (punya UI di Master Data tapi enforcement-nya nyaris tidak dipakai — menyesatkan, karena owner bisa ubah checkbox tapi tidak ada efeknya).

**Keputusan rebuild:** tabel `Permission` jadi **satu-satunya** sumber kebenaran, di-enforce di satu tempat (middleware + guard di setiap Server Action). Tidak ada lagi role-list hardcoded.

Supaya tetap simpel untuk user, tabel di-seed dengan default persis seperti perilaku lama — owner tidak perlu utak-atik apa pun kecuali memang mau custom:

| Module | owner | driver | sorter | sales |
|---|---|---|---|---|
| `dashboard` | full | view | view | view |
| `pengambilan` | full | view, create | — | — |
| `penerimaan` | full | — | view, create | — |
| `stok` | full | view | view, create* | view |
| `produk` | full | — | — | view, create* |
| `penjualan` | full | — | — | view, create |
| `retur` | full | — | — | view, create* |
| `keuangan` | full | — | — | — |
| `master_data` | full | — | — | — |
| `laporan` | full | — | — | view |
| `log` | full | — | — | — |
| `panduan` | view | view | view | view |
| `profil` | self | self | self | self |

\* `create` di sini berarti **mengajukan** (butuh approve owner), bukan langsung eksekusi — lihat §5.5.

### Seed akun demo (dev/staging saja)

| Username | Password | Role |
|---|---|---|
| owner | owner123 | owner |
| driver1 | driver123 | driver |
| sorter1 | sorter123 | sorter |
| sales1 | sales123 | sales |

⚠️ Seed ini **wajib dinonaktifkan di production** (versi lama meng-reset password demo user setiap kali `init_db()` jalan — jangan diulangi).

---

## 4. Modul & Halaman

### 4.1 Dashboard

Ringkasan operasional, tampilan menyesuaikan role.

**Owner:** filter tanggal (default 14 hari terakhir) + filter kebun.
- KPI: Stok total (kg), Omzet hari ini, Omzet periode, Pickup pending, Tray periode, Kg diterima.
- KPI approval: Produk pending, Adjustment stok pending, Koreksi pickup pending, Retur pending, **Laba bulan berjalan**.
- Blok "Perlu perhatian": alert dinamis (antrean approval, stok kosong) atau status aman.
- Chart: omzet harian (line), status order (bar), stok per kategori (bar + kartu warna per kategori), yield rata-rata %.
- Breakdown Sortir %: kartu per kategori — % dari total kg tersortir + kg absolut.
- Tabel: 10 pickup & 10 penjualan terbaru.
- Ringkasan Pendapatan/Pengeluaran/Selisih + Top 8 produk terlaris.

**Role lain:** KPI dasar + chart + tabel terbaru, periode fixed 14 hari, tanpa blok approval/laba.

---

### 4.2 Pengambilan (Pickup)

Driver mencatat pengambilan dari kebun → auto-generate SJ + QR + dokumen cetak.

**Tab:** Form Pickup · Riwayat · Permintaan Koreksi · *(Approve — owner)*

**Aturan inti: 1 kebun = 1 pickup per hari.** Field tray untuk kebun yang sudah punya pickup aktif (status ≠ cancelled) di tanggal sama otomatis terkunci + tampilkan SJ yang sudah ada.

**Form:** tanggal (default hari ini) · tray per kebun (dinamis dari tabel `Farm` aktif) · catatan · foto (opsional). Owner bisa pilih driver mana pun; driver dipaksa dirinya sendiri. **Satu submit bisa membuat >1 pickup sekaligus** (satu row per kebun yang tray-nya > 0).

**Format SJ:** `DDMMYYYY + kodeKebun` → mis. `29072026RH1`. Kalau collision, tambah suffix `-02`, `-03`, dst.

**QR payload:** `SJ:{sjNumber}|FARM:{farmCode}|DATE:{pickupDate}` → PNG. Setelah simpan: download QR + tombol cetak SJ (dokumen printable dengan QR ter-embed).

**Riwayat:** driver hanya lihat miliknya. Owner punya aksi:
- **Edit** — ubah kebun/tanggal/tray/catatan/status, re-validasi konflik kebun+tanggal, log diff.
- **Batalkan** — hanya status `pending`.
- **Hapus permanen** — kalau sudah ada `Receiving`, jalankan rollback stok penuh (§5.6).

**Permintaan Koreksi:** driver tidak bisa edit langsung — ajukan `ChangeRequest` dengan alasan wajib → owner approve/reject.

---

### 4.3 Penerimaan & Sortir

Sortir menimbang total kg dari SJ pending, pecah per kategori, commit ke stok.

**Tab:** Proses Penerimaan · Riwayat.

**Cari SJ — combobox search-as-you-type (perbaikan utama):** satu input, query live saat mengetik (cocokkan nomor SJ *dan* nama kebun), hanya menampilkan pickup `pending` yang belum punya `Receiving`. Hasil scan barcode/QR masuk ke input yang sama. **Tidak ada lagi radio "pilih dari daftar / ketik manual".**

**Form:** pilih SJ → auto-tampil kebun, tray, driver, foto pickup · total kg ditimbang · foto timbang (opsional) · "Dicek oleh" auto dari user login · catatan · input kg per kategori aktif.

**Perhitungan balance:**
```
sortedTotal = Σ kg semua kategori
diff        = |sortedTotal - totalKg|
tolerance   = Setting["receiving_tolerance_kg"]   // default 0.15 kg
balanced    = adaQty && diff <= tolerance
```
- **Sorter wajib balance.** **Owner boleh override** (tercatat eksplisit di catatan + log `receiving.override`).
- Ada dialog konfirmasi sebelum commit, dengan peringatan tegas kalau override.

**Saat commit (satu transaction):**
1. Guard race-condition di **level database** (`Receiving.pickupId` unique + `SELECT … FOR UPDATE` pada pickup) — bukan flag session.
2. Buat `Receiving`.
3. Per kategori kg>0: buat `SortingDetail` (kg, `percentage = kg/totalKg*100`, **`unitCost` & `totalCost` snapshot dari harga kebun** — §5.4) dan `InventoryMovement(in_sorting, +kg)`.
4. Set `Pickup.status = received`.
5. **Auto-buat `Expense`** kategori "Pembelian Kebun" sejumlah total biaya, `isAutoGenerated = true`, `relatedReceivingId` terisi (§5.4).

**Riwayat:** owner bisa hapus → rollback penuh via service bersama (§5.6), `Pickup.status` kembali `pending`, Expense auto-generated ikut terhapus.

---

### 4.4 Stok

**Section:** Kartu stok per kategori → Tren yield % → Riwayat mutasi (filter + pagination + export) → Adjustment → Transfer A→B → Approve Adjustment.

- **Stok** = `SUM(InventoryMovement.qtyKg)` per kategori (live).
- **Riwayat mutasi:** filter tipe / arah / kategori / ref / user / rentang tanggal. **Pagination asli** (bukan limit 500). Export CSV/Excel mengikuti filter aktif.
- **Adjustment (Owner) — langsung:** kategori + qty (+/−) + alasan wajib. Validasi `qty ≠ 0` dan guard stok negatif (§5.7).
- **Adjustment (Sorter) — via approval:** sama, tapi jadi `ChangeRequest(stock_adjustment, pending)`, belum bikin movement.
- **Transfer A→B (Owner):** kategori asal ≠ tujuan, qty > 0, alasan wajib, validasi stok asal cukup → buat 2 movement.
- **Approve Adjustment (Owner):** approve → baru buat movement. **Wajib re-validasi guard stok negatif saat approve, di dalam transaction yang sama** (di versi lama ini bolong — stok bisa berubah antara request dan approve).

---

### 4.5 Produk

Katalog produk `pure` (1 kategori) atau `mixed` (beberapa kategori dengan rasio). Resep (`ProductRecipe`) inilah yang menentukan konsumsi stok saat penjualan.

**Validasi baru (wajib): total rasio per produk harus = 1.0 (100%).** Di versi lama hanya dicek `> 0` — kalau owner isi total 150%, sistem memotong stok 1,5× lipat dari seharusnya per kg terjual, tanpa error apa pun. UI harus menampilkan indikator total rasio live (mis. "Total: 100% ✓" / "Total: 150% ✗") dan memblokir simpan kalau ≠ 100%.

**Approval:** field `approvalStatus` langsung di `Product`. Owner submit → `approved` + aktif. Sales submit → `pending` + belum aktif, sampai owner approve/reject.

Edit harga & status aktif: owner saja, pada produk approved.

---

### 4.6 Penjualan (Order)

**Tab:** Buat Order · Daftar Penjualan.

**Buat Order:** cari/pilih customer (combobox search) atau tambah baru inline · tanggal · metode kirim · **Penanggung Ongkir** (satu dropdown, §5.1) · biaya kirim · catatan · baris item dinamis (produk via combobox, qty kg, harga/kg — default dari `basePrice`, bisa di-override) · diskon (default dari `customer.defaultDiscountPct`).

**Validasi stok all-or-nothing** sebelum simpan — hitung kebutuhan per kategori termasuk toleransi susut (§5.3); kalau satu kategori saja kurang, seluruh order ditolak dengan pesan jelas kategori mana yang kurang berapa kg.

**Saat simpan (satu transaction):**
1. Buat `Sale(status=confirmed)` → generate `invoiceNumber = INV-YYYYMMDD-{id:04d}`.
2. Buat `SaleItem` per baris (qtyKg = **yang ditagih**, bukan yang dipotong dari stok).
3. **Stok dipotong di titik konfirmasi order** (bukan saat shipping) — `InventoryMovement(out_sale, −kebutuhan)` per kategori, sudah termasuk toleransi susut.
4. Hitung & simpan `totalCogs` (§5.4).
5. Proses ongkir sesuai `shippingPayer` (§5.1).
6. Kalau customer punya nomor HP: generate invoice PDF (A5) & kirim via WAHA.

**Lifecycle:**
```
confirmed → shipped → delivered
     ↘         ↘
      cancelled (owner only)
```
- `confirmed → shipped`: set `shippedAt`, kirim notifikasi WA.
- `shipped → delivered`: kirim notifikasi WA.
- **Cancel (owner):** restock via service pembalik (§5.6) + hapus Expense ongkir auto-generated yang terkait.
- Tombol resend invoice WA tersedia di detail order.

---

### 4.7 Retur

Retur dari order berstatus confirmed/shipped/delivered, **per kategori** (tidak wajib full-order).

**Validasi baru (wajib): qty retur per kategori ≤ qty yang pernah keluar untuk order itu, dikurangi retur yang sudah disetujui sebelumnya.** Di versi lama tidak ada validasi sama sekali — customer bisa "meretur" 100kg dari order 5kg dan stok bertambah 100kg tanpa peringatan. Referensinya adalah `InventoryMovement` bertipe `out_sale` milik order tersebut.

**Approval:** owner buat → langsung `approved` + stok kembali. Sales buat → `pending`, menunggu approve owner (approve → baru buat `InventoryMovement(in_return)`).

---

### 4.8 Keuangan

**Tab:** Dashboard · Pemasukan · Pengeluaran · Input Pengeluaran · Kategori.

- Filter tanggal + preset cepat (Hari ini / 7 hari / 30 hari / Bulan ini / Tahun ini).
- KPI: Pendapatan (exclude status `cancelled`), Pengeluaran, **Laba Kotor**, Total Ongkir, jumlah item pengeluaran.
- **Laba Kotor sekarang berbasis HPP** (§5.4): `Pendapatan − HPP − Pengeluaran operasional`. Versi lama cuma `Pendapatan − semua Expense` tanpa memisahkan biaya barang.
- **Input pengeluaran: form terstruktur, bukan parser teks.** Versi lama pakai textarea dengan format `Tanggal | Kategori | Jumlah | Deskripsi` yang rapuh (kategori tak dikenal di-fallback diam-diam ke "Lain-lain", nominal di-parse manual). Ganti dengan **grid baris-tambah** (klik "+ Baris", tiap baris punya date picker, dropdown kategori, input nominal, deskripsi) — lebih aman, dan jauh lebih enak dipakai dari HP. Template quick-fill tetap ada, tapi mengisi baris terstruktur, bukan menempel teks.
- Expense auto-generated (ongkir & pembelian kebun) ditandai badge "otomatis" dan **tidak bisa diedit manual** — sumbernya order/penerimaan terkait. Ini mencegah angka keuangan jadi tidak sinkron dengan operasional.
- Kelola `ExpenseCategory`; kategori sistem (`isSystem = true`: Ongkir, Pembelian Kebun) tidak bisa dihapus.

---

### 4.9 Master Data

**Tab:** Kategori · Kebun & Harga · User · Pelanggan · Hak Akses · Pengaturan.

- **Kategori:** nama* (unik), deskripsi, warna, urutan, **% toleransi susut jual** (§5.3), toggle aktif.
- **Kebun & Harga:** nama* (unik), kode* (unik, ≤10 char, auto-uppercase), lokasi, toggle aktif. **Sub-panel harga beli per kategori** dengan tanggal berlaku + riwayat harga (§5.4).
- **User:** username* (unik, tidak bisa diubah setelah dibuat), nama*, password (kosong saat edit = tidak berubah), role, phone, aktif.
- **Pelanggan:** nama*, phone, alamat, diskon default %, catatan, aktif. Peringatan (bukan blokir) kalau ada nama mirip — nama customer memang bisa kembar.
- **Hak Akses:** matrix role × module, 5 checkbox per sel, simpan sekaligus. Sekarang **benar-benar ditegakkan** (§3).
- **Pengaturan:** nama perusahaan, toleransi balance penerimaan (kg), toleransi susut default (%), konfigurasi WAHA (enable/URL/session/API key), backup database.

**Semua toggle aktif wajib menulis Activity Log** (di versi lama, toggle Kategori menulis log tapi toggle Kebun tidak — inkonsisten).

---

### 4.10 Laporan

Read-only, tanpa form.

- KPI: Omzet, HPP, Pengeluaran, **Laba Bersih**, Total Stok, Tray masuk, Kg diterima.
- Stok saat ini, Produk Terlaris (kg).
- Yield rata-rata % & tren yield harian per kategori — **satu shared query dengan halaman Stok** (di versi lama logic ini diduplikasi hampir verbatim di dua tempat).
- Efisiensi `kg/tray` = kgDiterima / totalTray.
- `% Ongkir vs Omzet` = totalOngkir / omzet × 100.
- Performa Driver (pickup + tray), Performa Sales (omzet), Top Pelanggan, **Perbandingan Kebun** (tray, kg, kg/tray, **biaya beli, dan biaya per kg** — baru, berkat §5.4).
- Export CSV/Excel.

---

### 4.11 Log Aktivitas

Audit trail immutable, owner saja, **read-only tanpa fitur hapus** (disengaja untuk audit).

Filter action/user/tanggal, pagination, detail viewer dengan diff before/after side-by-side, export CSV/Excel.

**Coverage action minimal** (acuan dari versi lama, plus yang baru): `pickup.create/edit/cancel/delete` · `receiving.create/override/delete` · `stock.adjust_direct/adjust_request/transfer/adjust_approve/adjust_reject` · `product.create/request/update/approve/reject` · `sale.create/status/cancel/wa_invoice/wa_shipped/wa_delivered` · `return.create/approve/reject` · `expense.create/bulk_create/edit/delete` · `expense_category.create/update` · `category.create/update/toggle` · `farm.create/update/toggle` · `farm_price.create/update` *(baru)* · `user.create/update` · `customer.create/update` · `permission.update` · `settings.update` · `profile.password_change` *(baru)*.

---

### 4.12 Panduan & FAQ

Halaman konten statis (Panduan Modul, Hak Akses Role, Alur Kerja, FAQ). Semua role. Prioritas rendah.

---

### 4.13 Profil

Ganti password sendiri: password lama, baru, konfirmasi. Minimal 8 karakter. **Wajib menulis Activity Log.**

---

## 5. Logika Bisnis Kunci

### 5.1 Ongkir — satu field, tiga skenario

Versi lama punya **dua** dropdown terpisah (`ongkir_oleh` dan `dibayar_oleh`) dengan kombinasi yang membingungkan, dan ketiganya sama-sama membuat Expense — termasuk saat buyer bayar langsung ke kurir (padahal toko tidak keluar uang sama sekali). **Ini bug pembukuan** dan sekaligus bikin form ribet.

**Versi baru: satu dropdown "Penanggung Ongkir" dengan 3 pilihan.**

| Pilihan (`shippingPayer`) | Arti | Masuk invoice buyer? | Expense? |
|---|---|---|---|
| **Buyer bayar langsung** (`buyer_direct`) | Penerima bayar cash ke kurir saat barang tiba | ❌ Tidak | ❌ Tidak — uang tidak pernah lewat toko |
| **Seller talangi, ditagih buyer** (`seller_billed`) | Toko bayar kurir dulu, biayanya ditambahkan ke tagihan | ✅ Ya | ✅ Ya — uang keluar, tertutup dari invoice |
| **Free ongkir** (`seller_free`) | Promo/gratis ongkir | ❌ Tidak | ✅ Ya — **beban murni toko** |

```
total = max(subtotal − diskon, 0) + (shippingPayer == seller_billed ? shippingCost : 0)

Expense ongkir dibuat HANYA jika shippingPayer ∈ {seller_billed, seller_free} DAN shippingCost > 0
```

Expense ongkir yang dibuat otomatis bertanda `isAutoGenerated = true` dan `relatedSaleId` terisi, sehingga ikut terhapus rapi saat order dibatalkan.

### 5.2 Resep produk

```
Total rasio semua kategori dalam 1 produk HARUS = 1.0
```
Divalidasi di client (indikator live) dan di server (Zod + guard sebelum commit). Produk `pure` = 1 kategori dengan rasio 1.0; produk `mixed` = beberapa kategori dengan total tepat 1.0.

### 5.3 Toleransi susut (dua jenis, jangan tertukar)

**a) Toleransi balance penerimaan** — `Setting["receiving_tolerance_kg"]`, default 0.15 kg. Menoleransi selisih timbangan antara total kg yang datang vs total hasil sortir (susut/penguapan dari kebun ke toko). Sudah ada di versi lama.

**b) Toleransi susut jual (BARU)** — `Category.shrinkagePct`, default 0%. Kompensasi karena saat packing ke konsumen kita selalu melebihkan sedikit (susut perjalanan toko→konsumen).

```
kebutuhanStok[kategori] = Σ (qtyItem × rasioResep) × (1 + shrinkagePct/100)
```

Contoh: JUMBO `shrinkagePct = 2`. Order 5 kg JUMBO → **stok dipotong 5,1 kg**, tapi **invoice tetap menagih 5 kg dengan harga normal**. Selisih 0,1 kg tercatat sebagai biaya nyata di HPP (§5.4), bukan hilang tanpa jejak.

Default per kategori diambil dari `Setting["default_shrinkage_pct"]` saat kategori baru dibuat, tapi bisa dioverride per kategori (JUMBO yang lebih rapuh bisa saja butuh toleransi lebih besar dari AB MIX).

Di UI order, kalau toleransi aktif, tampilkan info halus: *"Stok terpotong 5,1 kg (termasuk toleransi susut 2%)"* — supaya sales paham kenapa angka stok turun lebih banyak dari qty jual.

### 5.4 Harga beli per kebun & HPP (BARU)

**Masalah yang dipecahkan:** supplier ke depan akan banyak, dan tiap kebun punya harga berbeda untuk kategori yang sama. Tanpa ini, "Laba Kotor" cuma `omzet − pengeluaran` yang dicatat manual — tidak akurat dan gampang lupa.

**Cara kerja:**
1. Owner mengisi harga beli per **kebun × kategori** di Master Data, dengan `effectiveFrom` (tanggal mulai berlaku). Harga lama tidak ditimpa — jadi riwayat.
2. Saat **Penerimaan & Sortir** disimpan, sistem mengambil harga yang berlaku pada `pickupDate` (`effectiveFrom` terbesar yang ≤ pickupDate) dan **menyimpannya sebagai snapshot** di `SortingDetail.unitCost` / `totalCost`. Snapshot ini penting: kalau harga berubah bulan depan, laporan bulan lalu tidak ikut berubah.
3. Sistem otomatis membuat `Expense` kategori "Pembelian Kebun" sejumlah `Receiving.totalCost`, ditandai `isAutoGenerated`.
4. Saat **penjualan**, HPP dihitung dengan **weighted average cost** per kategori (rata-rata tertimbang dari stok yang ada), disimpan sebagai `Sale.totalCogs`.

```
avgCost[kategori] = Σ(totalCost dari SortingDetail yang masih jadi bagian stok)
                    ────────────────────────────────────────────────────────
                                Σ(kg yang masuk)

Sale.totalCogs = Σ (kebutuhanStok[kategori] × avgCost[kategori])
                 ↑ pakai kebutuhan stok (sudah termasuk susut), bukan qty tagih —
                   supaya biaya susut ikut terhitung sebagai biaya nyata
```

**Kalau harga kebun belum diisi:** penerimaan tetap bisa disimpan (jangan blokir operasional lapangan), tapi `unitCost = 0` dan muncul peringatan di UI + badge di dashboard owner: *"3 penerimaan belum punya harga beli — laba belum akurat"*. Owner bisa mengisi harga menyusul dan menjalankan recalculate untuk penerimaan yang terdampak.

**Dampak ke laporan:**
```
Laba Kotor  = Pendapatan − HPP
Laba Bersih = Laba Kotor − Pengeluaran operasional (di luar pembelian kebun)
```
Plus laporan baru: **biaya per kg per kebun**, sehingga owner bisa membandingkan kebun mana yang paling menguntungkan (bukan cuma paling banyak kirim).

### 5.5 Pola approval — seragamkan jadi satu

Versi lama punya **tiga** pola berbeda untuk hal yang secara konsep sama, tanpa alasan bisnis yang jelas:
1. Tabel `ChangeRequest` generic (koreksi Pickup, adjustment Stok).
2. Status field langsung di entity (approval Produk).
3. Status ditentukan saat create tergantung role pembuat (Retur).

**Keputusan rebuild:** semua approval pakai **aturan tunggal**:

> Kalau pembuatnya punya `canApprove` untuk modul itu → langsung `approved` dan efeknya (stok/data) langsung dieksekusi.
> Kalau tidak → `pending`, menunggu approver. Efek baru dieksekusi saat approve.

Struktur penyimpanannya tetap boleh berbeda (status di entity sendiri untuk Produk/Retur, `ChangeRequest` untuk koreksi Pickup & adjustment Stok yang memang mengubah data existing), tapi **perilakunya seragam** dan diimplementasikan lewat satu helper approval — jadi user tidak perlu menghafal "modul ini approval-nya beda".

### 5.6 Rollback stok — satu service bersama

Versi lama menulis ulang logic pembalik stok **tiga kali** (hapus pickup, hapus receiving, cancel order) dengan pola mirip tapi tidak identik — rawan salah satu terlewat kalau aturan berubah.

**Rebuild: satu fungsi service dipakai bertiga.**
```ts
reverseMovements({ refType, refId, reason, tx })
// 1. Ambil semua InventoryMovement dengan refType+refId tsb
// 2. Buat movement pembalik (qtyKg dinegasikan, tipe sesuai konteks)
// 3. Tulis ActivityLog dengan ringkasan total kg yang dibalik
// 4. Semua dalam transaction yang sama dengan operasi pemanggil
```

**Catatan desain:** versi lama **menghapus** movement asli lalu membuat adjustment pembalik. Rebuild sebaiknya **tidak menghapus** movement asli — cukup tambahkan movement pembalik, supaya ledger tetap utuh dan bisa diaudit ("kenapa stok pernah naik-turun?"). Ini juga membuat laporan historis tidak berubah retroaktif.

### 5.7 Guard stok negatif

```
stokSaatIni + delta >= -0.001    // epsilon untuk floating point
```
Dicek pada: adjustment langsung, transfer, **approve adjustment** (baru — versi lama bolong di sini), dan validasi order.

### 5.8 Format identifier

```
SJ      = DDMMYYYY + kodeKebun          contoh: 29072026RH1  (collision → -02, -03, …)
Invoice = INV-YYYYMMDD-{saleId:04d}     contoh: INV-20260805-0042
```

---

## 6. Upload File

- **Maksimum 1 MB per foto.** File lebih besar **otomatis di-resize/kompres di sisi client sebelum upload** (canvas resize → target sisi terpanjang ~1600px, kualitas JPEG ~0,8) — user tidak perlu memikirkan ukuran file, tinggal jepret dari HP. Kalau hasil kompres masih >1 MB, kompres bertahap turun sampai muat.
- **Validasi tipe file dari MIME/magic bytes asli, bukan dari ekstensi nama file** (versi lama hanya cek ekstensi — file apa pun bisa di-rename jadi `.jpg`).
- Tipe diizinkan: JPEG, PNG, WebP.
- Simpan ke object storage S3-compatible, bukan disk lokal — supaya siap multi-instance.
- Nama file di-generate sistem (UUID), bukan pakai nama asli dari user.

---

## 7. Integrasi Eksternal

### WAHA (WhatsApp HTTP API)
Self-hosted WhatsApp gateway. Config via Setting/env: `WAHA_URL` (default `http://localhost:3000`), `WAHA_SESSION` (default `"default"`), `WAHA_API_KEY`, flag enable.

- Endpoint: `POST /api/sendText`, `POST /api/sendFile` (payload base64).
- Trigger: invoice saat order dibuat · notifikasi shipped · notifikasi delivered · resend invoice manual.
- Normalisasi nomor: input `08xx` / `8xx` → `62xxxxxxxxxx@c.us`.
- **Pengiriman WA harus non-blocking** — kalau WAHA down, order tetap tersimpan dan user dapat notifikasi "invoice gagal terkirim, coba resend" (di versi lama sudah begini, pertahankan). Idealnya masuk queue retry ringan.

Tidak ada integrasi lain (tanpa payment gateway).

---

## 8. Ringkasan Perbaikan dari Hasil Audit

Semua temuan dari pembacaan source code lama, beserta keputusannya:

| # | Area | Temuan | Keputusan |
|---|---|---|---|
| 1 | Retur | Qty retur tidak divalidasi terhadap qty terjual — bisa retur melebihi order | ✅ Validasi terhadap movement `out_sale` order tsb (§4.7) |
| 2 | Stok | Approve adjustment tidak re-cek stok negatif | ✅ Re-validasi dalam transaction saat approve (§5.7) |
| 3 | Keuangan | Bulk expense pakai parser teks bebas, fallback kategori diam-diam | ✅ Ganti grid baris terstruktur (§4.8) |
| 4 | RBAC | Dua sistem otorisasi tumpang tindih, tabel Permission tidak ditegakkan | ✅ Permission jadi satu-satunya sumber kebenaran (§3) |
| 5 | Master Data | Toggle Kebun tidak menulis log (Kategori menulis) | ✅ Semua toggle wajib menulis log (§4.9) |
| 6 | Master Data | Customer tidak divalidasi duplikat | ✅ Peringatan nama mirip, tidak memblokir (§4.9) |
| 7 | Profil | Ganti password tidak ter-audit | ✅ Wajib menulis log (§4.13) |
| 8 | Penerimaan | Anti-double-submit hanya session-state | ✅ Unique constraint + row lock di DB (§4.3) |
| 9 | Penjualan | Ongkir selalu jadi Expense di 3 skenario termasuk saat buyer bayar langsung — double-count | ✅ Diperbaiki jadi 1 field, 3 skenario, expense hanya kalau toko benar-benar keluar uang (§5.1) |
| 10 | Penerimaan | Cari SJ pakai radio dropdown/ketik manual | ✅ Combobox search-as-you-type (§4.3) |
| 11 | Keamanan | Password minimum 4 karakter | ✅ Minimum 8 karakter (§3) |
| 12 | Penjualan | Status `draft` dead code | ✅ Dihapus dari enum & state machine (§2.1) |
| 13 | Produk | Total rasio resep tidak divalidasi = 100% — bisa potong stok berlebih senyap | ✅ Validasi ketat = 1.0 + indikator live (§5.2) |
| 14 | Semua list | Tidak ada pagination, data lama hilang diam-diam di balik hard-limit | ✅ Pagination asli di semua tabel (§4) |
| 15 | Stok | Logic rollback ditulis ulang 3× dengan pola berbeda | ✅ Satu service `reverseMovements`, ledger tidak dihapus (§5.6) |
| 16 | Config | Setting disimpan string bebas, di-parse tiap dipanggil | ✅ Typed config + toleransi susut jual sebagai fitur eksplisit (§5.3) |
| 17 | Upload | Validasi cuma dari ekstensi nama file, tanpa batas ukuran | ✅ Validasi MIME asli + max 1 MB dengan auto-resize client (§6) |
| 18 | Keuangan | Tidak ada harga beli per kebun — laba tidak akurat, supplier akan bertambah banyak | ✅ Harga per kebun×kategori dengan riwayat → HPP & laba akurat (§5.4) |
| 19 | Approval | Tiga pola approval berbeda untuk konsep yang sama | ✅ Diseragamkan jadi satu aturan (§5.5) |
| 20 | Laporan | Kalkulasi yield diduplikasi di Stok & Laporan | ✅ Satu shared query (§4.10) |
| 21 | Codebase | `app.py` & `Dashboard.py` nyaris identik (beda 2 baris) — file kembar tak terpakai | ✅ Tidak dibawa ke rebuild, cukup satu halaman Dashboard |
| 22 | Seed | `init_db()` me-reset password akun demo setiap start | ✅ Seed hanya untuk dev/staging, dinonaktifkan di production (§3) |

---

## 9. Design System

Palet diambil dari `ui_theme.py` versi lama — jadi acuan `tailwind.config`.

| Token | Light | Dark |
|---|---|---|
| Primary (brand) | `#e11d48` | `#fb7185` |
| Primary hover | `#be123c` | `#f43f5e` |
| Background | `#f8fafc` | `#0b0f14` |
| Surface / card | `#ffffff` | `#151c24` |
| Border | `#e2e8f0` | `#2a3441` |
| Text primary | `#0f172a` | `#f1f5f9` |
| Text muted | `#64748b` | `#94a3b8` |
| Sidebar | `#fff1f2` | `#0d1218` |
| Success | `#dcfce7` / `#16a34a` | `#052e16` / `#22c55e` |
| Warning | `#fef3c7` / `#f59e0b` | `#422006` / `#fbbf24` |
| Info | `#e0f2fe` / `#0284c7` | `#0c4a6e` / `#38bdf8` |
| Danger | `#fee2e2` / `#dc2626` | `#450a0a` / `#f87171` |

Font sans-serif sistem. Radius konsisten 10–18px. **Warna per kategori (`Category.color`) dipertahankan sebagai fitur** — dipakai di kartu stok & chart, bisa diatur owner. Dark/light toggle via `next-themes` (native, tanpa flicker).

---

## 10. Requirement UX (non-negotiable)

Berdasarkan keluhan langsung terhadap versi lama:

1. **Tanpa flicker antar halaman** — navigasi client-side penuh, skeleton loading, tidak ada full reload.
2. **Combobox search sebagai pola standar** untuk semua pencarian entity: SJ pending, customer, produk, kebun. Bukan dropdown polos, bukan input manual terpisah.
3. **Modal/dialog native**, bukan simulasi state + rerun.
4. **Mobile-first untuk role lapangan** — Driver (isi pickup di kebun) dan Sorter (isi timbangan di gudang) hampir pasti pakai HP. Target: satu tangan, tombol besar, input angka pakai keyboard numerik.
5. **Feedback instan** untuk aksi ringan (toggle aktif, approve/reject) — optimistic update, tidak perlu reload.
6. **Sedikit field, default cerdas.** Setiap form harus bisa diselesaikan dengan mengisi seminimal mungkin: tanggal default hari ini, harga default dari master, diskon default dari customer, "dicek oleh" otomatis dari user login, penanggung ongkir default dari pilihan terakhir customer tsb.
7. **Pesan error yang menjelaskan cara memperbaiki**, bukan sekadar "gagal" — mis. *"Stok JUMBO kurang 2,3 kg (tersedia 4,7 kg, dibutuhkan 7,0 kg termasuk toleransi susut 2%)"*.
8. **Integritas dijaga di level database**, bukan di UI — semua alur "create-once" pakai constraint & transaction.

---

## 11. Dependencies

```
next, react, react-dom, typescript
prisma, @prisma/client
next-auth (atau iron-session) + bcryptjs
tailwindcss, shadcn/ui (radix-ui), lucide-react
react-hook-form, zod, @hookform/resolvers
@tanstack/react-query
recharts
@react-pdf/renderer
qrcode
exceljs
date-fns
next-themes
@aws-sdk/client-s3   (atau SDK R2/MinIO)
browser-image-compression   (auto-resize foto sebelum upload)
```

---

## 12. Urutan Pengerjaan (Fase 1 — Parity + perbaikan)

| Sprint | Fokus | Isi |
|---|---|---|
| 1 | **Fondasi** | Setup Next.js + Prisma + Postgres, schema (§2), auth & session (§3), design system (§9), layout & navigasi bebas flicker (§10.1) |
| 2 | **Master Data & Audit** | Kategori (+ toleransi susut), Kebun **+ harga per kategori** (§5.4), User, Customer, Permission dengan enforcement penuh, Settings, infrastruktur Activity Log & service `reverseMovements` (§5.6) — dipakai semua sprint berikutnya |
| 3 | **Pengambilan** | Form multi-kebun, generator SJ + QR, cetak SJ, riwayat + pagination, edit/cancel/delete + rollback, alur koreksi driver → approve owner |
| 4 | **Penerimaan & Sortir** | Combobox search SJ (§4.3), form timbang + balance check, commit dengan DB-level guard, **snapshot harga beli + auto-expense** (§5.4), riwayat + rollback |
| 5 | **Stok** | Kartu stok live, mutasi + filter + pagination + export, adjustment langsung & via approval, transfer A→B, approve dengan re-validasi stok |
| 6 | **Produk** | CRUD + resep dengan **validasi rasio = 100%** (§5.2), approval flow |
| 7 | **Penjualan** | Order builder, **toleransi susut** (§5.3), validasi stok all-or-nothing, **ongkir 1-field** (§5.1), **perhitungan HPP** (§5.4), invoice PDF, WAHA, lifecycle status |
| 8 | **Retur** | Form per kategori + **validasi qty terhadap order** (§4.7), approval flow |
| 9 | **Keuangan** | Dashboard income/expense/HPP, **input grid terstruktur** (§4.8), kategori expense, expense auto-generated read-only |
| 10 | **Laporan** | Semua analitik, shared query yield, **perbandingan kebun berbasis biaya** (§4.10) |
| 11 | **Dashboard** | Rakit widget per role |
| 12 | **Polish & Rilis** | Panduan/FAQ, Profil (+ audit log), QA lintas role, uji beban ringan, deploy |

---

## 13. Roadmap Fase 2 (setelah parity)

Kandidat, diputuskan belakangan setelah baseline berjalan:

- **PWA installable** untuk Driver & Sorter — bisa dipasang di home screen HP, tetap jalan saat sinyal lemah di kebun (offline queue untuk form pickup).
- **Notifikasi real-time** di dashboard owner (antrean approval muncul tanpa refresh).
- **Multi-gudang / multi-lokasi** kalau nanti ada lebih dari satu titik penyimpanan.
- **Analitik supplier lanjutan** — tren harga beli antar kebun, prediksi yield per kebun per musim, peringkat profitabilitas kebun.
- **Import/export data massal** (harga kebun, customer) via Excel.
- **Payment gateway** kalau nanti ada pembayaran online dari customer.
- **Laporan otomatis terjadwal** via WhatsApp ke owner (ringkasan harian/mingguan).

---

## 14. Catatan Migrasi Data

- **User & password:** hash bcrypt lama kompatibel dengan `bcryptjs` — tabel User bisa diimpor apa adanya. Role `admin` lama → map ke `owner`.
- **Enum:** nilai string sama persis, kecuali `SaleStatus.draft` yang dihapus — order lama berstatus `draft` (kalau ada) perlu diputuskan: di-cancel atau di-promote ke `confirmed`.
- **Pickup:** versi lama menyimpan `farmName` sebagai **string bebas**, versi baru pakai `farmId` (relasi). Migrasi perlu mencocokkan nama ke tabel `Farm`; nama yang tidak cocok harus ditangani manual.
- **Expense:** versi lama `category` string bebas, versi baru `categoryId` relasi. Migrasi perlu mapping; yang tidak cocok masuk "Lain-lain".
- **Data historis tanpa harga beli:** penerimaan lama tidak punya `unitCost` — biarkan 0 dan tandai, atau isi retroaktif kalau owner punya catatan harga. Laporan HPP hanya akurat sejak harga kebun mulai diisi.
- **File upload lama** (`uploads/`) perlu dimigrasi ke object storage + update path di DB, kalau data produksi lama dipakai.
- **Data demo lama** tidak perlu dibawa — cukup seed script baru untuk dev/staging.
