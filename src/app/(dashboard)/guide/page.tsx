"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  HelpCircle,
  Workflow,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react"

/* ─── helper: tiny alert box (no shadcn Alert component) ─── */
function AlertInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

function AlertWarn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

function AlertSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

/* ─── helper: code / calculation block ─── */
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  )
}

/* ─── helper: step list ─── */
function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {i + 1}
          </Badge>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  )
}

/* ─── helper: flow arrow ─── */
function Flow({ steps }: { steps: { label: string; badge?: string; variant?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          <span className="rounded-md bg-muted px-2 py-1 font-medium">
            {s.label}
          </span>
          {s.badge && (
            <Badge variant={(s.variant as "default" | "secondary" | "destructive" | "outline") || "default"} className="text-[10px]">
              {s.badge}
            </Badge>
          )}
        </span>
      ))}
    </div>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function GuidePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Panduan & FAQ</h1>

      <Tabs defaultValue="modul">
        <TabsList className="flex-wrap">
          <TabsTrigger value="modul">
            <BookOpen className="mr-1 h-4 w-4" /> Panduan Modul
          </TabsTrigger>
          <TabsTrigger value="akses">
            <Shield className="mr-1 h-4 w-4" /> Hak Akses
          </TabsTrigger>
          <TabsTrigger value="alur">
            <Workflow className="mr-1 h-4 w-4" /> Alur Kerja
          </TabsTrigger>
          <TabsTrigger value="study">
            <HelpCircle className="mr-1 h-4 w-4" /> Study Case
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────
            TAB 1 — PANDUAN MODUL
            ───────────────────────────────────────────────────── */}
        <TabsContent value="modul" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Panduan Modul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Pengambilan (Pickup):</strong> Driver mencatat pengambilan dari kebun
                → sistem auto-generate Surat Jalan (SJ) + QR Code unik.
              </p>
              <p>
                <strong>Penerimaan & Sortir:</strong> Sorter menerima SJ, menimbang, dan
                memecah hasil panen per kategori → stok bertambah sesuai kategori.
              </p>
              <p>
                <strong>Stok (Inventory):</strong> Semua pergerakan stok tercatat di ledger
                mutasi. Adjustment stok oleh sorter membutuhkan approval owner.
              </p>
              <p>
                <strong>Produk:</strong> Dapat dibuat pure (satu kategori) atau mixed (beberapa
                kategori dengan resep/rasio). Total rasio harus = 100%.
              </p>
              <p>
                <strong>Penjualan (Order):</strong> Stok dipotong saat order dikonfirmasi.
                Menghitung kebutuhan stok termasuk toleransi susut per kategori.
              </p>
              <p>
                <strong>Retur:</strong> Retur dapat diajukan sales (pending approval) atau
                langsung oleh owner (auto-approved). Stok kembali saat retur disetujui.
              </p>
              <p>
                <strong>Keuangan:</strong> Omzet dari order delivered, HPP dari stok terjual,
                pengeluaran input manual + auto-generated (ongkir, pembelian kebun).
              </p>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible>
            <AccordionItem value="q1">
              <AccordionTrigger>
                Kenapa stok terpotong lebih dari qty jual?
              </AccordionTrigger>
              <AccordionContent>
                Karena toleransi susut. Misal JUMBO susut 2%, order 5 kg → stok terpotong
                5,1 kg. Rasio susut bisa dikonfigurasi per kategori.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Bagaimana cara retur?</AccordionTrigger>
              <AccordionContent>
                Sales ajukan retur per kategori, status &quot;pending&quot;. Owner approve → stok
                kembali. Owner juga bisa buat retur langsung tanpa approval.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>
                Kenapa harga di invoice beda dari master?
              </AccordionTrigger>
              <AccordionContent>
                Harga bisa di-override per order. Harga default dari master produk, tapi sales
                bisa ubah saat membuat order.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>
                Apa itu SJ (Surat Jalan) dan bagaimana formatnya?
              </AccordionTrigger>
              <AccordionContent>
                SJ adalah nomor unik yang di-generate otomatis saat pickup. Format:
                <code> DDMMYYYY + KodeKebun</code> (misal: 05082026RH1). SJ menyertakan QR
                code yang bisa discan saat penerimaan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>Bagaimana cara kerja approval stok?</AccordionTrigger>
              <AccordionContent>
                User dengan role sorter/sales tidak punya <code>canApprove</code>权限. Saat mereka
                ingin mengubah stok, sistem membuat ChangeRequest (status: pending). Owner
                melihat di approval queue, lalu approve/reject.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────
            TAB 2 — HAK AKSES
            ───────────────────────────────────────────────────── */}
        <TabsContent value="akses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Hak Akses (RBAC)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                Setiap user memiliki role yang menentukan modul mana yang bisa diakses dan
                aksi apa yang bisa dilakukan.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Modul yang Diakses</TableHead>
                    <TableHead>Aksi Khusus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge>Owner</Badge>
                    </TableCell>
                    <TableCell>Semua modul (penuh)</TableCell>
                    <TableCell>Approve, cancel order, transfer stok, kelola keuangan</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">Driver</Badge>
                    </TableCell>
                    <TableCell>Dashboard, Pickup</TableCell>
                    <TableCell>Buat pickup baru, lihat SJ</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Sorter</Badge>
                    </TableCell>
                    <TableCell>Penerimaan, Stok (lihat), Adjustment</TableCell>
                    <TableCell>Terima SJ, sortir, adjustment stok (pending approval)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="destructive">Sales</Badge>
                    </TableCell>
                    <TableCell>Produk, Penjualan, Retur, Customer</TableCell>
                    <TableCell>Buat order, buat retur (pending approval)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <AlertWarn>
                <strong>Catatan penting:</strong> Sorter dan Sales tidak punya{" "}
                <code>canApprove</code>. Setiap perubahan stok yang mereka ajukan akan masuk
                ke queue approval owner.
              </AlertWarn>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aksi</TableHead>
                    <TableHead className="text-center">Owner</TableHead>
                    <TableHead className="text-center">Driver</TableHead>
                    <TableHead className="text-center">Sorter</TableHead>
                    <TableHead className="text-center">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Buat Pickup", "✓", "✓", "—", "—"],
                    ["Terima SJ & Sortir", "✓", "—", "✓", "—"],
                    ["Adjustment Stok", "✓ (auto)", "—", "✓ (pending)", "—"],
                    ["Buat Produk", "✓ (auto)", "—", "—", "✓ (pending)"],
                    ["Buat Order", "✓", "—", "—", "✓"],
                    ["Buat Retur", "✓ (auto)", "—", "—", "✓ (pending)"],
                    ["Kelola Keuangan", "✓", "—", "—", "—"],
                    ["Transfer Stok", "✓", "—", "—", "—"],
                    ["Approve Request", "✓", "—", "—", "—"],
                    ["Cancel Order", "✓", "—", "—", "—"],
                  ].map(([aksi, owner, driver, sorter, sales], i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{aksi}</TableCell>
                      <TableCell className="text-center">{owner}</TableCell>
                      <TableCell className="text-center">{driver}</TableCell>
                      <TableCell className="text-center">{sorter}</TableCell>
                      <TableCell className="text-center">{sales}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────
            TAB 3 — ALUR KERJA
            ───────────────────────────────────────────────────── */}
        <TabsContent value="alur" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" /> Alur Kerja Utama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {/* Pickup → Penerimaan */}
              <div>
                <h3 className="font-semibold mb-2">
                  1. Alur Pengambilan → Penerimaan
                </h3>
                <Flow
                  steps={[
                    { label: "Driver buat Pickup", badge: "driver" },
                    { label: "SJ + QR tergenerate", badge: "auto" },
                    { label: "Driver download QR / cetak SJ" },
                    { label: "Sorter scan QR di Penerimaan", badge: "sorter" },
                    { label: "Isi berat per kategori", badge: "sorter" },
                    { label: "Submit → stok bertambah", badge: "auto" },
                  ]}
                />
              </div>
              <Separator />

              {/* Order Lifecycle */}
              <div>
                <h3 className="font-semibold mb-2">2. Alur Order Penjualan</h3>
                <Flow
                  steps={[
                    { label: "Draft", badge: "baru", variant: "outline" },
                    { label: "Confirmed", badge: "stok dipotong", variant: "default" },
                    { label: "Shipped", badge: "WA notif", variant: "secondary" },
                    { label: "Delivered", badge: "omzet tercatat", variant: "destructive" },
                  ]}
                />
                <p className="mt-2 text-muted-foreground text-xs">
                  Order juga bisa dibatalkan (cancelled) oleh owner → semua stok dikembalikan.
                </p>
              </div>
              <Separator />

              {/* Retur */}
              <div>
                <h3 className="font-semibold mb-2">3. Alur Retur</h3>
                <Flow
                  steps={[
                    { label: "Sales buat retur", badge: "pending" },
                    { label: "Owner approve", badge: "approved" },
                    { label: "Stok kembali", badge: "in_return", variant: "secondary" },
                  ]}
                />
                <p className="mt-2 text-muted-foreground text-xs">
                  Jika owner langsung buat retur → langsung approved tanpa tahap approval.
                </p>
              </div>
              <Separator />

              {/* Adjustment */}
              <div>
                <h3 className="font-semibold mb-2">4. Alur Adjustment Stok</h3>
                <Flow
                  steps={[
                    { label: "Sorter ajukan perubahan", badge: "pending" },
                    { label: "Owner lihat di Approval Queue" },
                    { label: "Approve → stok berubah", badge: "auto" },
                  ]}
                />
                <p className="mt-2 text-muted-foreground text-xs">
                  Guard: stok tidak boleh negatif setelah adjustment.
                </p>
              </div>
              <Separator />

              {/* Keuangan */}
              <div>
                <h3 className="font-semibold mb-2">5. Alur Keuangan</h3>
                <Flow
                  steps={[
                    { label: "Omzet (dari delivered orders)", badge: "otomatis" },
                    { label: "HPP (stok × harga beli)", badge: "otomatis" },
                    { label: "Pengeluaran (input + auto)", badge: "mixed" },
                    { label: "Laba Bersih = Omzet - HPP - Pengeluaran" },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagram Alur Pickup → Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock>{`
  ┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
  │  KEBUN   │────▶│  PICKUP  │────▶│    SJ +    │────▶│ PENERIMA │
  │ (RH1)    │     │ (driver) │     │  QR Code   │     │ (sorter) │
  └──────────┘     └──────────┘     └────────────┘     └────┬─────┘
                                                            │
                                                            ▼
                                                     ┌────────────┐
                                                     │  SORTIR    │
                                                     │ per        │
                                                     │ kategori   │
                                                     └─────┬──────┘
                                                           │
                                          ┌────────────────┼────────────────┐
                                          ▼                ▼                ▼
                                    ┌──────────┐    ┌──────────┐    ┌──────────┐
                                    │  JUMBO   │    │    B     │    │ AB MIX   │
                                    │ +100 kg  │    │ +50 kg   │    │ +30 kg   │
                                    └──────────┘    └──────────┘    └──────────┘
                                          │                │                │
                                          ▼                ▼                ▼
                                    ═══════════════════════════════════════════
                                         Inventory Ledger (mutasi stok)
                                    ═══════════════════════════════════════════
`}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────
            TAB 4 — STUDY CASE
            ───────────────────────────────────────────────────── */}
        <TabsContent value="study" className="space-y-4">
          <AlertInfo>
            Study case berikut mendemonstrasikan setiap fitur aplikasi dengan contoh
            dunia nyata. Semua perhitungan dan alur mengikuti logika bisnis yang sebenarnya
            di sistem.
          </AlertInfo>

          {/* ════════════════════════════════════════════
              STUDY CASE 1 — Pickup Harian
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                Pickup Harian
                <Badge variant="secondary">Driver</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Pak Budi (driver1) pergi ke Kebun Rahayu (RH1) pada 5 Agustus 2026.
                Dia mengambil 20 tray strawberry.&quot;
              </div>

              <h4 className="font-semibold">Langkah-langkah:</h4>
              <Steps
                items={[
                  "Login sebagai driver1",
                  "Buka menu Pickup → Klik &quot;Buat Pickup Baru&quot;",
                  "Isi tanggal: 5 Agustus 2026",
                  "Pilih kebun: Kebun Rahayu (kode: RH1)",
                  "Isi jumlah tray: 20",
                  "Submit → sistem auto-generate SJ",
                ]}
              />

              <h4 className="font-semibold">Hasil:</h4>
              <div className="space-y-2">
                <p>
                  <strong>SJ Number:</strong>{" "}
                  <Badge variant="default">05082026RH1</Badge>
                </p>
                <p>
                  <strong>Format SJ:</strong>{" "}
                  <code>DDMMYYYY + KodeKebun</code>
                </p>
                <p>
                  <strong>QR Payload:</strong>{" "}
                  <code>05082026RH1|driver1|20tray</code>
                </p>
              </div>

              <AlertWarn>
                <strong>Aturan:</strong> 1 kebun = maksimal 1 pickup per hari. Jika driver
                sudah membuat pickup untuk RH1 pada tanggal yang sama, sistem akan menolak
                pickup kedua.
              </AlertWarn>

              <p className="text-muted-foreground text-xs">
                Setelah submit, driver bisa download QR code dan cetak SJ untuk dibawa ke
                lokasi penerimaan.
              </p>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 2 — Penerimaan & Sortir
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                Penerimaan &amp; Sortir
                <Badge variant="outline">Sorter</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Pak Andi (sorter1) menerima SJ 05082026RH1 dari Pak Budi. Hasil
                penimbangan total 180 kg. Hasil sortir: JUMBO 100 kg, B 50 kg, AB MIX 30
                kg.&quot;
              </div>

              <h4 className="font-semibold">Langkah-langkah:</h4>
              <Steps
                items={[
                  "Login sebagai sorter1",
                  "Buka menu Penerimaan → Cari SJ 05082026RH1 (scan QR atau ketik manual)",
                  "Isi total berat ditimbang: 180 kg",
                  "Isi hasil sortir per kategori:",
                  "  → JUMBO: 100 kg",
                  "  → B: 50 kg",
                  "  → AB MIX: 30 kg",
                  "Cek balance: total sortir (180 kg) vs total ditimbang (180 kg)",
                  "Submit → stok bertambah + auto-expense Pembelian Kebun",
                ]}
              />

              <h4 className="font-semibold">Kalkulasi Harga Beli (snapshot dari FarmCategoryPrice):</h4>
              <CodeBlock>{`
Kategori    Qty      Harga/kg    Subtotal
─────────────────────────────────────────
JUMBO       100 kg × Rp 35,000 = Rp 3,500,000
B            50 kg × Rp 25,000 = Rp 1,250,000
AB MIX       30 kg × Rp 20,000 = Rp   600,000
─────────────────────────────────────────
TOTAL                   = Rp 5,350,000
`}</CodeBlock>

              <h4 className="font-semibold">Yang terjadi di sistem:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Inventory bertambah: JUMBO +100, B +50, AB MIX +30
                </li>
                <li>
                  Auto-expense &quot;Pembelian Kebun RH1&quot; tercatat: Rp 5,350,000
                </li>
                <li>
                  Harga beli di-snapshot dari master FarmCategoryPrice (bukan dari
                  master produk)
                </li>
              </ul>

              <AlertSuccess>
                Penerimaan berhasil! Stok telah bertambah dan pengeluaran pembelian kebun
                tercatat otomatis di keuangan.
              </AlertSuccess>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 3 — Toleransi Susut
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                Toleransi Susut Penerimaan
                <Badge variant="secondary">Validasi</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Scenario A: Balance */}
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400">
                  ✅ Skenario: Balance
                </h4>
                <div className="rounded-lg bg-muted/50 p-3 italic">
                  &quot;Total ditimbang 180 kg, hasil sortir = 100+50+30 = 180 kg&quot;
                </div>
                <CodeBlock>{`
Total ditimbang : 180 kg
Total sortir    : 100 + 50 + 30 = 180 kg
Selisih         : |180 - 180| = 0 kg
Toleransi       : 0.15 kg

0 kg ≤ 0.15 kg → ✅ BALANCE → Bisa submit!
`}</CodeBlock>
              </div>

              <Separator />

              {/* Scenario B: Tidak Balance */}
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-400">
                  ❌ Skenario: Tidak Balance
                </h4>
                <div className="rounded-lg bg-muted/50 p-3 italic">
                  &quot;Total ditimbang 180 kg, tapi hasil sortir = 100+48+30 = 178 kg&quot;
                </div>
                <CodeBlock>{`
Total ditimbang : 180 kg
Total sortir    : 100 + 48 + 30 = 178 kg
Selisih         : |180 - 178| = 2 kg
Toleransi       : 0.15 kg

2 kg > 0.15 kg → ❌ TIDAK BALANCE → Submit ditolak!
Sorter harus koreksi jumlah sortir.
`}</CodeBlock>
              </div>

              <AlertWarn>
                <strong>Penting:</strong> Toleransi susut diterapkan di penerimaan (sorter harus
                isi ulang) DAN di penjualan (stok dipotong lebih banyak sesuai rasio susut
                kategori).
              </AlertWarn>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 4 — Buat Produk dengan Resep
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                Buat Produk dengan Resep
                <Badge variant="destructive">Owner</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Owner membuat produk &apos;Mix Berry Segar&apos; dengan resep: JUMBO 50%, B
                30%, AB MIX 20%. Total rasio = 100% ✓&quot;
              </div>

              <h4 className="font-semibold">Dua Tipe Produk:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Contoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="default">Pure</Badge>
                    </TableCell>
                    <TableCell>Satu kategori saja, rasio = 100%</TableCell>
                    <TableCell>Strawberry JUMBO Premium</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">Mixed</Badge>
                    </TableCell>
                    <TableCell>Beberapa kategori, total rasio harus = 100%</TableCell>
                    <TableCell>Mix Berry Segar</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <h4 className="font-semibold">Resep Mix Berry Segar:</h4>
              <CodeBlock>{`
Kategori    Rasio
───────────────
JUMBO       50%  (0.5)
B           30%  (0.3)
AB MIX      20%  (0.2)
───────────────
TOTAL      100%  (1.0) ✅
`}</CodeBlock>

              <h4 className="font-semibold">Validasi Sistem:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Total rasio harus tepat = 1.0 (100%). Jika tidak, form tidak bisa di-submit.
                </li>
                <li>
                  Minimal 1 kategori harus dipilih.
                </li>
                <li>
                  Setiap rasio harus &gt; 0.
                </li>
              </ul>

              <h4 className="font-semibold">Approval Flow:</h4>
              <Flow
                steps={[
                  { label: "Sales buat produk", badge: "pending" },
                  { label: "Owner approve", badge: "approved" },
                ]}
              />
              <p className="text-muted-foreground text-xs">
                Jika produk dibuat oleh owner, status langsung &quot;approved&quot;. Jika dibuat
                oleh sales, status &quot;pending&quot; dan menunggu approval owner.
              </p>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 5 — Buat Order Penjualan
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  5
                </span>
                Buat Order Penjualan
                <Badge variant="destructive">Sales</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Sales1 membuat order untuk Toko Buah Segar: 10 kg Strawberry JUMBO
                Premium + 5 kg Mix Berry Segar.&quot;
              </div>

              <h4 className="font-semibold">Langkah-langkah:</h4>
              <Steps
                items={[
                  "Login sebagai sales1",
                  "Buka menu Penjualan → Klik &quot;Buat Order Baru&quot;",
                  "Pilih customer: Toko Buah Segar",
                  "Tambah item pertama: Strawberry JUMBO Premium × 10 kg × Rp 50,000",
                  "Tambah item kedua: Mix Berry Segar × 5 kg × Rp 40,000",
                  "Sistem hitung total otomatis",
                  "Submit → status: draft",
                ]}
              />

              <h4 className="font-semibold">Kalkulasi Kebutuhan Stok (tanpa susut):</h4>
              <CodeBlock>{`
Item                    Kategori    Rasio   Qty    Kebutuhan Stok
─────────────────────────────────────────────────────────────────
JUMBO Premium 10kg  →   JUMBO       1.0     10kg   10 × 1.0  = 10.0 kg
Mix Berry 5kg      →   JUMBO       0.5      5kg    5 × 0.5  =  2.5 kg
Mix Berry 5kg      →   B           0.3      5kg    5 × 0.3  =  1.5 kg
Mix Berry 5kg      →   AB MIX      0.2      5kg    5 × 0.2  =  1.0 kg
─────────────────────────────────────────────────────────────────
TOTAL STOK DIBUTUHKAN:
  JUMBO   = 10.0 + 2.5 = 12.5 kg
  B       = 1.5 kg
  AB MIX  = 1.0 kg
`}</CodeBlock>

              <h4 className="font-semibold">Kalkulasi dengan Susut (JUMBO susut 2%):</h4>
              <CodeBlock>{`
JUMBO susut 2% → faktor = 1.02

Kebutuhan stok JUMBO:
  10kg × 1.0 × 1.02 = 10.20 kg
   5kg × 0.5 × 1.02 =  2.55 kg
  ─────────────────────────────
  Total JUMBO        = 12.75 kg (vs 12.5 tanpa susut)

B       = 1.5 kg (tanpa susut karena tidak di-order langsung)
AB MIX  = 1.0 kg (tanpa susut karena tidak di-order langsung)
`}</CodeBlock>

              <h4 className="font-semibold">Validasi All-or-Nothing:</h4>
              <AlertWarn>
                Sistem memvalidasi SEMUA kategori sekaligus. Jika stok JUMBO cukup tapi stok
                B tidak cukup, order TIDAK BISA dibuat. Ini mencegah partial fulfillment.
              </AlertWarn>

              <h4 className="font-semibold">HPP (Harga Pokok Penjualan):</h4>
              <CodeBlock>{`
HPP = total kebutuhan stok × harga beli per kategori

JUMBO  : 12.75 kg × Rp 35,000 = Rp 446,250
B      :  1.50 kg × Rp 25,000 = Rp  37,500
AB MIX :  1.00 kg × Rp 20,000 = Rp  20,000
─────────────────────────────────────────────
HPP Total                      = Rp 503,750
`}</CodeBlock>

              <p className="text-muted-foreground text-xs">
                HPP tercatat saat order dikonfirmasi (confirmed). Jika order dibatalkan, HPP
                tidak tercatat.
              </p>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 6 — Ongkir 3 Skenario
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  6
                </span>
                Ongkir — 3 Skenario
                <Badge variant="secondary">Keuangan</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Order Rp 800.000, biaya kirim Rp 25.000&quot;
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skenario</TableHead>
                    <TableHead>Total Bayar</TableHead>
                    <TableHead>Expense Ongkir</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      1. Buyer bayar langsung
                    </TableCell>
                    <TableCell>Rp 800,000</TableCell>
                    <TableCell>
                      <Badge variant="outline">Tidak ada</Badge>
                    </TableCell>
                    <TableCell>Buyer bayar ongkir ke kurir sendiri</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      2. Seller talangi
                    </TableCell>
                    <TableCell>Rp 825,000</TableCell>
                    <TableCell>
                      <Badge variant="default">Rp 25,000</Badge>
                    </TableCell>
                    <TableCell>Expense ongkir auto-generated untuk toko</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">3. Free ongkir</TableCell>
                    <TableCell>Rp 800,000</TableCell>
                    <TableCell>
                      <Badge variant="default">Rp 25,000</Badge>
                    </TableCell>
                    <TableCell>Expense ongkir beban toko (free ongkir promo)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <CodeBlock>{`
Skenario 1 — Buyer bayar langsung:
  Total bayar   = Rp 800,000
  Expense ongkir = tidak ada
  Omzet tercatat = Rp 800,000

Skenario 2 — Seller talangi:
  Total bayar   = Rp 800,000 + Rp 25,000 = Rp 825,000
  Expense ongkir = Rp 25,000 (auto-generated)
  Omzet tercatat = Rp 825,000

Skenario 3 — Free ongkir:
  Total bayar   = Rp 800,000
  Expense ongkir = Rp 25,000 (auto-generated, beban toko)
  Omzet tercatat = Rp 800,000
`}</CodeBlock>

              <AlertInfo>
                Expense ongkir dibuat otomatis saat order dikonfirmasi. Jika order dibatalkan,
                expense ongkir terkait juga dihapus.
              </AlertInfo>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 7 — Lifecycle Order
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  7
                </span>
                Lifecycle Order
                <Badge>Flow</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Order dikonfirmasi → dikirim → diterima&quot;
              </div>

              <h4 className="font-semibold">Transisi Status:</h4>
              <Flow
                steps={[
                  { label: "Draft", badge: "baru", variant: "outline" },
                  { label: "Confirmed", badge: "stok dipotong + HPP", variant: "default" },
                  { label: "Shipped", badge: "WA notif + shippedAt", variant: "secondary" },
                  { label: "Delivered", badge: "WA notif + omzet", variant: "destructive" },
                ]}
              />

              <h4 className="font-semibold">Detail Setiap Transisi:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transisi</TableHead>
                    <TableHead>Yang Terjadi</TableHead>
                    <TableHead>Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <code>draft → confirmed</code>
                    </TableCell>
                    <TableCell>
                      Stok dipotong (termasuk susut), HPP tercatat, expense ongkir dibuat
                      (jika applicable)
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Sales / Owner</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <code>confirmed → shipped</code>
                    </TableCell>
                    <TableCell>
                      Set <code>shippedAt</code>, kirim WA notifikasi ke customer
                    </TableCell>
                    <TableCell>
                      <Badge>Owner</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <code>shipped → delivered</code>
                    </TableCell>
                    <TableCell>
                      Kirim WA notifikasi, omzet tercatat di keuangan
                    </TableCell>
                    <TableCell>
                      <Badge>Owner</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <code>any → cancelled</code>
                    </TableCell>
                    <TableCell>
                      Restock semua stok (reverse), hapus expense ongkir auto-generated
                    </TableCell>
                    <TableCell>
                      <Badge>Owner</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <AlertWarn>
                <strong>Pembatalan hanya bisa dilakukan owner.</strong> Semua stok yang
                terpotong akan dikembalikan. Expense ongkir yang auto-generated juga dihapus.
              </AlertWarn>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 8 — Retur
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  8
                </span>
                Retur
                <Badge variant="outline">Sales / Owner</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Toko Buah Segar meretur 3 kg JUMBO dari order yang sudah delivered.&quot;
              </div>

              <h4 className="font-semibold">Dua Jalur Retur:</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      <Badge variant="destructive">Sales</Badge> Buat Retur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <Flow
                      steps={[
                        { label: "Buat retur" },
                        { label: "Pending", badge: "menunggu" },
                        { label: "Owner approve", badge: "approved" },
                        { label: "Stok kembali" },
                      ]}
                    />
                    <p className="text-muted-foreground">
                      Status: pending → approved (oleh owner)
                    </p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      <Badge>Owner</Badge> Buat Retur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <Flow
                      steps={[
                        { label: "Buat retur" },
                        { label: "Approved", badge: "langsung" },
                        { label: "Stok kembali" },
                      ]}
                    />
                    <p className="text-muted-foreground">
                      Status: langsung approved, stok kembali otomatis
                    </p>
                  </CardContent>
                </Card>
              </div>

              <h4 className="font-semibold">Validasi Retur:</h4>
              <CodeBlock>{`
Qty retur ≤ (qty yang pernah keluar) - (retur yang sudah approved)

Contoh:
  Order asli: 10 kg JUMBO
  Retur sudah approved: 0 kg
  Max retur: 10 - 0 = 10 kg → retur 3 kg ✅

  Jika sudah ada retur 7 kg approved:
  Max retur: 10 - 7 = 3 kg → retur 3 kg ✅ (pas)
  Retur 4 kg → ❌ DITOLAK (melebihi batas)
`}</CodeBlock>

              <h4 className="font-semibold">Yang terjadi saat retur disetujui:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  InventoryMovement type: <Badge variant="secondary">in_return</Badge>
                </li>
                <li>Stok kategori terkait bertambah sesuai qty retur</li>
                <li>Omzet berkurang sesuai harga jual × qty retur</li>
              </ul>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 9 — Adjustment Stok
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  9
                </span>
                Adjustment Stok &amp; Approval
                <Badge variant="outline">Sorter → Owner</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Sorter1 ingin mengurangi stok B sebanyak 2 kg (rusak).&quot;
              </div>

              <h4 className="font-semibold">Alur untuk Sorter (tanpa canApprove):</h4>
              <Steps
                items={[
                  "Login sebagai sorter1",
                  "Buka menu Stok → Klik Adjustment",
                  "Pilih kategori: B",
                  "Input perubahan: -2 kg (pengurangan)",
                  "Isi alasan: &quot;Rusak&quot;",
                  "Submit → ChangeRequest dibuat (status: pending)",
                  "Menunggu approval dari owner",
                ]}
              />

              <h4 className="font-semibold">Alur untuk Owner (canApprove):</h4>
              <Steps
                items={[
                  "Login sebagai owner",
                  "Buka Approval Queue",
                  "Lihat ChangeRequest dari sorter1: &quot;Kurangi B -2 kg&quot;",
                  "Review alasan dan jumlah",
                  "Approve → stok B berkurang 2 kg",
                ]}
              />

              <CodeBlock>{`
Sebelum adjustment:
  Stok B = 50 kg

ChangeRequest: -2 kg (alasan: rusak)
Status: pending → approved

Sesudah approval:
  Stok B = 50 - 2 = 48 kg

Guard: jika stok B = 1 kg dan request -2 kg
  → 1 - 2 = -1 kg → ❌ DITOLAK (stok negatif!)
`}</CodeBlock>

              <AlertWarn>
                <strong>Guard negatif:</strong> Sistem memastikan stok tidak menjadi negatif
                setelah adjustment. Jika hasilnya negatif, approval akan ditolak.
              </AlertWarn>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 10 — Keuangan & HPP
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  10
                </span>
                Keuangan &amp; HPP
                <Badge>Owner</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Bulan Agustus: Omzet Rp 5,000,000, HPP Rp 3,200,000, Pengeluaran Rp
                500,000&quot;
              </div>

              <h4 className="font-semibold">Kalkulasi Laba:</h4>
              <CodeBlock>{`
╔═══════════════════════════════════════════╗
║         LAPORAN KEUANGAN AGUSTUS          ║
╠═══════════════════════════════════════════╣
║ Omzet (dari order delivered)              ║
║                              Rp 5,000,000 ║
║                                           ║
║ HPP (harga pokok penjualan)               ║
║                             - Rp 3,200,000 ║
║ ───────────────────────────────────────── ║
║ LABA KOTOR                     Rp 1,800,000║
║                                           ║
║ Pengeluaran (manual + auto)               ║
║                             - Rp   500,000 ║
║ ══════════════════════════════════════════║
║ LABA BERSIH                    Rp 1,300,000║
╚═══════════════════════════════════════════╝

Rumus:
  Laba Kotor  = Omzet - HPP
              = 5,000,000 - 3,200,000
              = 1,800,000

  Laba Bersih = Laba Kotor - Pengeluaran
              = 1,800,000 - 500,000
              = 1,300,000
`}</CodeBlock>

              <h4 className="font-semibold">Jenis Pengeluaran:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Input</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="default">Auto-generated</Badge>
                    </TableCell>
                    <TableCell>Ongkir (dari order), Pembelian Kebun (dari penerimaan)</TableCell>
                    <TableCell>Otomatis, read-only</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">Manual</Badge>
                    </TableCell>
                    <TableCell>Gaji, sewa, listrik, dll.</TableCell>
                    <TableCell>Input manual via grid terstruktur</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <AlertInfo>
                Owner bisa input pengeluaran manual via grid terstruktur (tanggal, kategori,
                nominal, keterangan). Pengeluaran auto-generated (ongkir + pembelian kebun)
                ditampilkan sebagai read-only.
              </AlertInfo>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 11 — Transfer Stok
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  11
                </span>
                Transfer Stok
                <Badge>Owner</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Owner memindahkan 10 kg dari kategori B ke kategori AB MIX.&quot;
              </div>

              <h4 className="font-semibold">Langkah-langkah:</h4>
              <Steps
                items={[
                  "Login sebagai owner",
                  "Buka menu Stok → Transfer Stok",
                  "Pilih kategori asal: B",
                  "Pilih kategori tujuan: AB MIX",
                  "Input jumlah: 10 kg",
                  "Submit → 2 InventoryMovement dibuat",
                ]}
              />

              <CodeBlock>{`
Transfer: B → AB MIX (10 kg)

Guard check: Stok B ≥ 10 kg?
  Stok B = 50 kg → ✅ Bisa transfer

Movements yang dibuat:
  1. B:      -10 kg (out_transfer)
  2. AB MIX: +10 kg (in_transfer)

Hasil:
  Stok B:      50 - 10 = 40 kg
  Stok AB MIX: 30 + 10 = 40 kg
`}</CodeBlock>

              <AlertWarn>
                <strong>Guard:</strong> Transfer hanya bisa dilakukan owner. Stok kategori asal
                harus mencukupi. Jika stok B = 5 kg dan transfer 10 kg → ditolak.
              </AlertWarn>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════
              STUDY CASE 12 — RBAC & Permissions
              ════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  12
                </span>
                RBAC &amp; Permissions
                <Badge variant="outline">Keamanan</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 italic">
                &quot;Sales1 mencoba mengakses halaman Keuangan → Ditolak.&quot;
              </div>

              <h4 className="font-semibold">Contoh: Sales1 coba akses Keuangan</h4>
              <Steps
                items={[
                  "Login sebagai sales1",
                  "Navigasi ke /finance (atau klik menu Keuangan)",
                  "Sistem check: role sales → permission: finance.read = false",
                  "Akses ditolak → redirect ke dashboard atau tampilkan pesan error",
                ]}
              />

              <h4 className="font-semibold">Permission per Role:</h4>
              <CodeBlock>{`
Owner:   [full_access] → bisa akses SEMUA halaman dan aksi
Driver:  [dashboard, pickup] → hanya dashboard + buat pickup
Sorter:  [receiving, stock_read, adjustment] → penerimaan + stok
Sales:   [products, orders, returns, customers] → penjualan

Kunci:
  canApprove  = true  → hanya Owner
  canCancel    = true  → hanya Owner
  canTransfer  = true  → hanya Owner
  canFinance   = true  → hanya Owner
`}</CodeBlock>

              <h4 className="font-semibold">Skenario Lain:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Hasil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="destructive">Sales1</Badge>
                    </TableCell>
                    <TableCell>Akses /finance</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Ditolak</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">Driver1</Badge>
                    </TableCell>
                    <TableCell>Akses /orders</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Ditolak</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Sorter1</Badge>
                    </TableCell>
                    <TableCell>Adjustment stok</TableCell>
                    <TableCell>
                      <Badge variant="default">Pending approval</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge>Owner</Badge>
                    </TableCell>
                    <TableCell>Semua aksi</TableCell>
                    <TableCell>
                      <Badge variant="default">Diperbolehkan</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <AlertSuccess>
                RBAC memastikan setiap user hanya bisa mengakses modul dan melakukan aksi
                sesuai role-nya. Pelanggaran permission dicegah di level client dan server.
              </AlertSuccess>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
