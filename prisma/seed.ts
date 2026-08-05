import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ═══════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════
  const ownerUser = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      name: 'Owner',
      role: 'owner',
      passwordHash: await bcrypt.hash('owner123', 10),
    },
  })

  const driverUser = await prisma.user.upsert({
    where: { username: 'driver1' },
    update: {},
    create: {
      username: 'driver1',
      name: 'Driver 1',
      role: 'driver',
      passwordHash: await bcrypt.hash('driver123', 10),
    },
  })

  const sorterUser = await prisma.user.upsert({
    where: { username: 'sorter1' },
    update: {},
    create: {
      username: 'sorter1',
      name: 'Sorter 1',
      role: 'sorter',
      passwordHash: await bcrypt.hash('sorter123', 10),
    },
  })

  const salesUser = await prisma.user.upsert({
    where: { username: 'sales1' },
    update: {},
    create: {
      username: 'sales1',
      name: 'Sales 1',
      role: 'sales',
      passwordHash: await bcrypt.hash('sales123', 10),
    },
  })

  console.log('  ✅ Users (4)')

  // ═══════════════════════════════════════════════
  // 2. CATEGORIES
  // ═══════════════════════════════════════════════
  const catJumbo = await prisma.category.upsert({
    where: { name: 'JUMBO' },
    update: {},
    create: { name: 'JUMBO', color: '#e11d48', sortOrder: 1, shrinkagePct: 2 },
  })

  const catB = await prisma.category.upsert({
    where: { name: 'B' },
    update: {},
    create: { name: 'B', color: '#f59e0b', sortOrder: 2, shrinkagePct: 1 },
  })

  const catAbMix = await prisma.category.upsert({
    where: { name: 'AB MIX' },
    update: {},
    create: { name: 'AB MIX', color: '#22c55e', sortOrder: 3, shrinkagePct: 0 },
  })

  console.log('  ✅ Categories (3)')

  // ═══════════════════════════════════════════════
  // 3. FARMS
  // ═══════════════════════════════════════════════
  const farmRahayu = await prisma.farm.upsert({
    where: { name: 'Kebun Rahayu' },
    update: {},
    create: { name: 'Kebun Rahayu', code: 'RH1', location: 'Lembang' },
  })

  const farmMakmur = await prisma.farm.upsert({
    where: { name: 'Kebun Makmur' },
    update: {},
    create: { name: 'Kebun Makmur', code: 'MK1', location: 'Ciwidey' },
  })

  const farmSejahtera = await prisma.farm.upsert({
    where: { name: 'Kebun Sejahtera' },
    update: {},
    create: { name: 'Kebun Sejahtera', code: 'ST1', location: 'Pangalengan' },
  })

  console.log('  ✅ Farms (3)')

  // ═══════════════════════════════════════════════
  // 4. FARM CATEGORY PRICES (effectiveFrom 1 Jul 2026)
  // ═══════════════════════════════════════════════
  const effectiveFrom = new Date('2026-07-01')

  const farmPriceData = [
    { farmId: farmRahayu.id, categoryId: catJumbo.id, pricePerKg: 35000 },
    { farmId: farmRahayu.id, categoryId: catB.id, pricePerKg: 25000 },
    { farmId: farmRahayu.id, categoryId: catAbMix.id, pricePerKg: 20000 },
    { farmId: farmMakmur.id, categoryId: catJumbo.id, pricePerKg: 33000 },
    { farmId: farmMakmur.id, categoryId: catB.id, pricePerKg: 23000 },
    { farmId: farmMakmur.id, categoryId: catAbMix.id, pricePerKg: 18000 },
    { farmId: farmSejahtera.id, categoryId: catJumbo.id, pricePerKg: 30000 },
    { farmId: farmSejahtera.id, categoryId: catB.id, pricePerKg: 20000 },
    { farmId: farmSejahtera.id, categoryId: catAbMix.id, pricePerKg: 15000 },
  ]

  for (const fp of farmPriceData) {
    await prisma.farmCategoryPrice.upsert({
      where: {
        farmId_categoryId_effectiveFrom: {
          farmId: fp.farmId,
          categoryId: fp.categoryId,
          effectiveFrom,
        },
      },
      update: { pricePerKg: fp.pricePerKg },
      create: { ...fp, effectiveFrom },
    })
  }

  console.log('  ✅ FarmCategoryPrices (9)')

  // ═══════════════════════════════════════════════
  // 5. EXPENSE CATEGORIES
  // ═══════════════════════════════════════════════
  for (const cat of [
    { name: 'Ongkir', icon: '🚚', sortOrder: 1, isSystem: true },
    { name: 'Pembelian Kebun', icon: '🌱', sortOrder: 2, isSystem: true },
    { name: 'Operasional', icon: '⚙️', sortOrder: 3 },
    { name: 'Gaji', icon: '💰', sortOrder: 4 },
    { name: 'Lain-lain', icon: '📦', sortOrder: 99 },
  ]) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  console.log('  ✅ ExpenseCategories (5)')

  // ═══════════════════════════════════════════════
  // 6. SETTINGS
  // ═══════════════════════════════════════════════
  for (const s of [
    { key: 'company_name', value: 'Strawberry Fresh Supply' },
    { key: 'receiving_tolerance_kg', value: '0.15' },
    { key: 'default_shrinkage_pct', value: '0' },
    { key: 'waha_enabled', value: 'false' },
    { key: 'waha_url', value: 'http://localhost:3000' },
    { key: 'waha_session', value: 'default' },
  ]) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log('  ✅ Settings (6)')

  // ═══════════════════════════════════════════════
  // 7. PERMISSIONS (13 modules × 4 roles)
  // ═══════════════════════════════════════════════
  const modules = [
    'dashboard',
    'pengambilan',
    'penerimaan',
    'stok',
    'produk',
    'penjualan',
    'retur',
    'keuangan',
    'master_data',
    'laporan',
    'log',
    'panduan',
    'profil',
  ]

  const canViewModules: Record<string, string[]> = {
    owner: modules,
    driver: ['dashboard', 'pengambilan', 'stok', 'panduan', 'profil'],
    sorter: ['dashboard', 'penerimaan', 'stok', 'panduan', 'profil'],
    sales: [
      'dashboard',
      'stok',
      'produk',
      'penjualan',
      'retur',
      'laporan',
      'panduan',
      'profil',
    ],
  }

  const canCreateModules: Record<string, string[]> = {
    owner: modules,
    driver: ['pengambilan'],
    sorter: ['penerimaan', 'stok'],
    sales: ['stok', 'produk', 'penjualan', 'retur'],
  }

  for (const role of ['owner', 'driver', 'sorter', 'sales'] as const) {
    for (const mod of modules) {
      const canView = canViewModules[role].includes(mod)
      const canCreate = canCreateModules[role].includes(mod)
      const isOwner = role === 'owner'

      await prisma.permission.upsert({
        where: { role_module: { role, module: mod } },
        update: {
          canView,
          canCreate,
          canEdit: isOwner,
          canDelete: isOwner,
          canApprove: isOwner,
        },
        create: {
          role,
          module: mod,
          canView,
          canCreate,
          canEdit: isOwner,
          canDelete: isOwner,
          canApprove: isOwner,
        },
      })
    }
  }

  console.log('  ✅ Permissions (52)')

  // ═══════════════════════════════════════════════
  // 8. CUSTOMERS
  // ═══════════════════════════════════════════════
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Toko Buah Segar',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 10',
      defaultDiscountPct: 5,
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'minimarket Haleluya',
      phone: '085678901234',
      address: 'Jl. Kenanga No. 25',
      defaultDiscountPct: 0,
    },
  })

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Distributor Bandung Raya',
      phone: '087890123456',
      address: 'Jl. Asia Afrika No. 5',
      defaultDiscountPct: 10,
    },
  })

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Kafe Strawberry House',
      phone: '089012345678',
      address: 'Jl. Dago No. 100',
      defaultDiscountPct: 3,
    },
  })

  console.log('  ✅ Customers (4)')

  // ═══════════════════════════════════════════════
  // 9. PRODUCTS (with recipes, total ratio = 1.0)
  // ═══════════════════════════════════════════════
  const product1 = await prisma.product.upsert({
    where: { name: 'Strawberry JUMBO Premium' },
    update: {},
    create: {
      name: 'Strawberry JUMBO Premium',
      productType: 'pure',
      basePrice: 85000,
      description: 'Premium JUMBO grade strawberries, pure single-origin',
      approvalStatus: 'approved',
      createdBy: ownerUser.name,
      recipes: {
        create: { categoryId: catJumbo.id, ratio: 1.0 },
      },
    },
  })

  const product2 = await prisma.product.upsert({
    where: { name: 'Strawberry Grade B' },
    update: {},
    create: {
      name: 'Strawberry Grade B',
      productType: 'pure',
      basePrice: 65000,
      description: 'Good quality Grade B strawberries, pure single-origin',
      approvalStatus: 'approved',
      createdBy: ownerUser.name,
      recipes: {
        create: { categoryId: catB.id, ratio: 1.0 },
      },
    },
  })

  const product3 = await prisma.product.upsert({
    where: { name: 'Mix Berry Segar' },
    update: {},
    create: {
      name: 'Mix Berry Segar',
      productType: 'mixed',
      basePrice: 75000,
      description: 'Fresh mixed berries: JUMBO 50%, B 30%, AB MIX 20%',
      approvalStatus: 'approved',
      createdBy: ownerUser.name,
      recipes: {
        create: [
          { categoryId: catJumbo.id, ratio: 0.5 },
          { categoryId: catB.id, ratio: 0.3 },
          { categoryId: catAbMix.id, ratio: 0.2 },
        ],
      },
    },
  })

  const product4 = await prisma.product.upsert({
    where: { name: 'Berry Campuran Ekonomis' },
    update: {},
    create: {
      name: 'Berry Campuran Ekonomis',
      productType: 'mixed',
      basePrice: 55000,
      description: 'Economy mixed berries: B 60%, AB MIX 40%',
      approvalStatus: 'approved',
      createdBy: ownerUser.name,
      recipes: {
        create: [
          { categoryId: catB.id, ratio: 0.6 },
          { categoryId: catAbMix.id, ratio: 0.4 },
        ],
      },
    },
  })

  console.log('  ✅ Products (4) with recipes')

  // ═══════════════════════════════════════════════
  // 10. PICKUPS (5, across last 7 days from 2026-08-05)
  // ═══════════════════════════════════════════════
  // SJ format: DDMMYYYY + farmCode
  const pickup1 = await prisma.pickup.upsert({
    where: { sjNumber: '30072026RH1' },
    update: {},
    create: {
      driverId: driverUser.id,
      farmId: farmRahayu.id,
      pickupDate: new Date('2026-07-30'),
      trayCount: 20,
      sjNumber: '30072026RH1',
      barcodeData: '30072026RH1',
      notes: 'Pengambilan rutin dari Kebun Rahayu',
      status: 'received',
    },
  })

  const pickup2 = await prisma.pickup.upsert({
    where: { sjNumber: '31072026MK1' },
    update: {},
    create: {
      driverId: driverUser.id,
      farmId: farmMakmur.id,
      pickupDate: new Date('2026-07-31'),
      trayCount: 16,
      sjNumber: '31072026MK1',
      barcodeData: '31072026MK1',
      notes: 'Pengambilan dari Kebun Makmur',
      status: 'received',
    },
  })

  const pickup3 = await prisma.pickup.upsert({
    where: { sjNumber: '01082026ST1' },
    update: {},
    create: {
      driverId: driverUser.id,
      farmId: farmSejahtera.id,
      pickupDate: new Date('2026-08-01'),
      trayCount: 12,
      sjNumber: '01082026ST1',
      barcodeData: '01082026ST1',
      notes: 'Pengambilan dari Kebun Sejahtera',
      status: 'received',
    },
  })

  const pickup4 = await prisma.pickup.upsert({
    where: { sjNumber: '02082026RH1' },
    update: {},
    create: {
      driverId: driverUser.id,
      farmId: farmRahayu.id,
      pickupDate: new Date('2026-08-02'),
      trayCount: 15,
      sjNumber: '02082026RH1',
      barcodeData: '02082026RH1',
      notes: 'Pengambilan tambahan dari Kebun Rahayu',
      status: 'pending',
    },
  })

  const pickup5 = await prisma.pickup.upsert({
    where: { sjNumber: '03082026MK1' },
    update: {},
    create: {
      driverId: driverUser.id,
      farmId: farmMakmur.id,
      pickupDate: new Date('2026-08-03'),
      trayCount: 10,
      sjNumber: '03082026MK1',
      barcodeData: '03082026MK1',
      notes: 'Dibatalkan karena cuaca buruk',
      status: 'cancelled',
    },
  })

  console.log('  ✅ Pickups (5): 3 received, 1 pending, 1 cancelled')

  // ═══════════════════════════════════════════════
  // 11. RECEIVINGS (3, one per received pickup)
  // ═══════════════════════════════════════════════
  //
  // Receiving 1 (RH1): totalKg=100
  //   JUMBO=40kg, B=35kg, AB MIX=25kg  → sum=100 ✓
  //   cost = 40×35000 + 35×25000 + 25×20000 = 1,400,000+875,000+500,000 = 2,775,000
  //
  // Receiving 2 (MK1): totalKg=80
  //   JUMBO=30kg, B=30kg, AB MIX=20kg  → sum=80 ✓
  //   cost = 30×33000 + 30×23000 + 20×18000 = 990,000+690,000+360,000 = 2,040,000
  //
  // Receiving 3 (ST1): totalKg=60
  //   JUMBO=20kg, B=25kg, AB MIX=15kg  → sum=60 ✓
  //   cost = 20×30000 + 25×20000 + 15×15000 = 600,000+500,000+225,000 = 1,325,000

  const receiving1 = await prisma.receiving.upsert({
    where: { pickupId: pickup1.id },
    update: {},
    create: {
      pickupId: pickup1.id,
      totalKg: 100,
      checkedById: sorterUser.id,
      checkedByName: sorterUser.name,
      checkDate: new Date('2026-07-30'),
      isBalanced: true,
      totalCost: 2775000,
      notes: 'Penerimaan dari Kebun Rahayu',
    },
  })

  const receiving2 = await prisma.receiving.upsert({
    where: { pickupId: pickup2.id },
    update: {},
    create: {
      pickupId: pickup2.id,
      totalKg: 80,
      checkedById: sorterUser.id,
      checkedByName: sorterUser.name,
      checkDate: new Date('2026-07-31'),
      isBalanced: true,
      totalCost: 2040000,
      notes: 'Penerimaan dari Kebun Makmur',
    },
  })

  const receiving3 = await prisma.receiving.upsert({
    where: { pickupId: pickup3.id },
    update: {},
    create: {
      pickupId: pickup3.id,
      totalKg: 60,
      checkedById: sorterUser.id,
      checkedByName: sorterUser.name,
      checkDate: new Date('2026-08-01'),
      isBalanced: true,
      totalCost: 1325000,
      notes: 'Penerimaan dari Kebun Sejahtera',
    },
  })

  console.log('  ✅ Receivings (3)')

  // ═══════════════════════════════════════════════
  // 12. SORTING DETAILS
  // ═══════════════════════════════════════════════
  await prisma.sortingDetail.createMany({
    data: [
      // Receiving 1 (RH1) – totalKg=100
      {
        receivingId: receiving1.id,
        categoryId: catJumbo.id,
        kg: 40,
        percentage: 40,
        unitCost: 35000,
        totalCost: 1400000,
      },
      {
        receivingId: receiving1.id,
        categoryId: catB.id,
        kg: 35,
        percentage: 35,
        unitCost: 25000,
        totalCost: 875000,
      },
      {
        receivingId: receiving1.id,
        categoryId: catAbMix.id,
        kg: 25,
        percentage: 25,
        unitCost: 20000,
        totalCost: 500000,
      },
      // Receiving 2 (MK1) – totalKg=80
      {
        receivingId: receiving2.id,
        categoryId: catJumbo.id,
        kg: 30,
        percentage: 37.5,
        unitCost: 33000,
        totalCost: 990000,
      },
      {
        receivingId: receiving2.id,
        categoryId: catB.id,
        kg: 30,
        percentage: 37.5,
        unitCost: 23000,
        totalCost: 690000,
      },
      {
        receivingId: receiving2.id,
        categoryId: catAbMix.id,
        kg: 20,
        percentage: 25,
        unitCost: 18000,
        totalCost: 360000,
      },
      // Receiving 3 (ST1) – totalKg=60
      {
        receivingId: receiving3.id,
        categoryId: catJumbo.id,
        kg: 20,
        percentage: 33.33,
        unitCost: 30000,
        totalCost: 600000,
      },
      {
        receivingId: receiving3.id,
        categoryId: catB.id,
        kg: 25,
        percentage: 41.67,
        unitCost: 20000,
        totalCost: 500000,
      },
      {
        receivingId: receiving3.id,
        categoryId: catAbMix.id,
        kg: 15,
        percentage: 25,
        unitCost: 15000,
        totalCost: 225000,
      },
    ],
  })

  console.log('  ✅ SortingDetails (9)')

  // ═══════════════════════════════════════════════
  // 13. INVENTORY MOVEMENTS – in_sorting from receivings
  // ═══════════════════════════════════════════════
  await prisma.inventoryMovement.createMany({
    data: [
      // Receiving 1 (RH1): JUMBO +40, B +35, AB MIX +25
      {
        categoryId: catJumbo.id,
        movementType: 'in_sorting',
        qtyKg: 40,
        refType: 'receiving',
        refId: receiving1.id,
        notes: 'Penerimaan dari Kebun Rahayu',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catB.id,
        movementType: 'in_sorting',
        qtyKg: 35,
        refType: 'receiving',
        refId: receiving1.id,
        notes: 'Penerimaan dari Kebun Rahayu',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catAbMix.id,
        movementType: 'in_sorting',
        qtyKg: 25,
        refType: 'receiving',
        refId: receiving1.id,
        notes: 'Penerimaan dari Kebun Rahayu',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      // Receiving 2 (MK1): JUMBO +30, B +30, AB MIX +20
      {
        categoryId: catJumbo.id,
        movementType: 'in_sorting',
        qtyKg: 30,
        refType: 'receiving',
        refId: receiving2.id,
        notes: 'Penerimaan dari Kebun Makmur',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catB.id,
        movementType: 'in_sorting',
        qtyKg: 30,
        refType: 'receiving',
        refId: receiving2.id,
        notes: 'Penerimaan dari Kebun Makmur',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catAbMix.id,
        movementType: 'in_sorting',
        qtyKg: 20,
        refType: 'receiving',
        refId: receiving2.id,
        notes: 'Penerimaan dari Kebun Makmur',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      // Receiving 3 (ST1): JUMBO +20, B +25, AB MIX +15
      {
        categoryId: catJumbo.id,
        movementType: 'in_sorting',
        qtyKg: 20,
        refType: 'receiving',
        refId: receiving3.id,
        notes: 'Penerimaan dari Kebun Sejahtera',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catB.id,
        movementType: 'in_sorting',
        qtyKg: 25,
        refType: 'receiving',
        refId: receiving3.id,
        notes: 'Penerimaan dari Kebun Sejahtera',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
      {
        categoryId: catAbMix.id,
        movementType: 'in_sorting',
        qtyKg: 15,
        refType: 'receiving',
        refId: receiving3.id,
        notes: 'Penerimaan dari Kebun Sejahtera',
        createdById: sorterUser.id,
        createdByName: sorterUser.name,
      },
    ],
  })

  console.log('  ✅ InventoryMovements – in_sorting (9)')

  // ═══════════════════════════════════════════════
  // 14. SALES (3 orders)
  //
  // Sale 1 – Customer 1 (Toko Buah Segar, 5% disc), confirmed
  //   5kg Strawberry JUMBO Premium @ 85,000 = 425,000
  //   subtotal=425,000  discount=21,250  shipping(buyer)=15,000
  //   totalAmount=425,000-21,250+15,000=418,750  COGS=5×33,000=165,000
  //
  // Sale 2 – Customer 3 (Distributor Bandung Raya, 10% disc), shipped
  //   10kg Mix Berry Segar @ 75,000 = 750,000
  //    8kg Berry Campuran Ekonomis @ 55,000 = 440,000
  //   subtotal=1,190,000  discount=119,000  shipping(seller_billed)=25,000
  //   totalAmount=1,190,000-119,000+25,000=1,096,000
  //   COGS=10×27,000+8×21,000=270,000+168,000=438,000
  //
  // Sale 3 – Customer 4 (Kafe Strawberry House, 3% disc), delivered
  //   3kg Strawberry Grade B @ 65,000 = 195,000
  //   subtotal=195,000  discount=5,850  shipping(seller_free)=10,000
  //   totalAmount=195,000-5,850=189,150  COGS=3×23,000=69,000
  // ═══════════════════════════════════════════════
  const sale1 = await prisma.sale.create({
    data: {
      customerId: customer1.id,
      saleDate: new Date('2026-08-03'),
      subtotal: 425000,
      discountAmount: 21250,
      shippingMethod: 'Motor',
      shippingPayer: 'buyer_direct',
      shippingCost: 15000,
      totalAmount: 418750,
      totalCogs: 165000,
      status: 'confirmed',
      notes: 'Pesanan rutin dari Toko Buah Segar',
      createdById: salesUser.id,
    },
  })

  const sale2 = await prisma.sale.create({
    data: {
      customerId: customer3.id,
      saleDate: new Date('2026-08-04'),
      subtotal: 1190000,
      discountAmount: 119000,
      shippingMethod: 'Mobil Box',
      shippingPayer: 'seller_billed',
      shippingCost: 25000,
      totalAmount: 1096000,
      totalCogs: 438000,
      status: 'shipped',
      notes: 'Pesanan besar dari Distributor Bandung Raya',
      createdById: salesUser.id,
      shippedAt: new Date('2026-08-04'),
    },
  })

  const sale3 = await prisma.sale.create({
    data: {
      customerId: customer4.id,
      saleDate: new Date('2026-08-05'),
      subtotal: 195000,
      discountAmount: 5850,
      shippingMethod: 'Motor',
      shippingPayer: 'seller_free',
      shippingCost: 10000,
      totalAmount: 189150,
      totalCogs: 69000,
      status: 'delivered',
      notes: 'Pengiriman gratis ke Kafe Strawberry House',
      createdById: salesUser.id,
      shippedAt: new Date('2026-08-05'),
    },
  })

  // Update invoice numbers: INV-YYYYMMDD-{id:04d}
  await prisma.sale.update({
    where: { id: sale1.id },
    data: { invoiceNumber: `INV-20260803-${String(sale1.id).padStart(4, '0')}` },
  })
  await prisma.sale.update({
    where: { id: sale2.id },
    data: { invoiceNumber: `INV-20260804-${String(sale2.id).padStart(4, '0')}` },
  })
  await prisma.sale.update({
    where: { id: sale3.id },
    data: { invoiceNumber: `INV-20260805-${String(sale3.id).padStart(4, '0')}` },
  })

  console.log('  ✅ Sales (3) with invoice numbers')

  // ═══════════════════════════════════════════════
  // 15. SALE ITEMS
  // ═══════════════════════════════════════════════
  await prisma.saleItem.createMany({
    data: [
      // Sale 1: 5kg Strawberry JUMBO Premium @ 85,000
      {
        saleId: sale1.id,
        productId: product1.id,
        qtyKg: 5,
        unitPrice: 85000,
        subtotal: 425000,
      },
      // Sale 2: 10kg Mix Berry Segar @ 75,000
      {
        saleId: sale2.id,
        productId: product3.id,
        qtyKg: 10,
        unitPrice: 75000,
        subtotal: 750000,
      },
      // Sale 2: 8kg Berry Campuran Ekonomis @ 55,000
      {
        saleId: sale2.id,
        productId: product4.id,
        qtyKg: 8,
        unitPrice: 55000,
        subtotal: 440000,
      },
      // Sale 3: 3kg Strawberry Grade B @ 65,000
      {
        saleId: sale3.id,
        productId: product2.id,
        qtyKg: 3,
        unitPrice: 65000,
        subtotal: 195000,
      },
    ],
  })

  console.log('  ✅ SaleItems (4)')

  // ═══════════════════════════════════════════════
  // 13b. INVENTORY MOVEMENTS – out_sale from sales
  //
  // Sale 1: 5kg JUMBO Premium → 5kg JUMBO out
  // Sale 2: 10kg Mix Berry (JUMBO=0.5,B=0.3,AB MIX=0.2) → 5 JUMBO, 3 B, 2 AB MIX out
  //         8kg Ekonomis (B=0.6,AB MIX=0.4) → 4.8 B, 3.2 AB MIX out
  // Sale 3: 3kg Grade B → 3kg B out
  // ═══════════════════════════════════════════════
  await prisma.inventoryMovement.createMany({
    data: [
      // Sale 1 → JUMBO -5
      {
        categoryId: catJumbo.id,
        movementType: 'out_sale',
        qtyKg: -5,
        refType: 'sale',
        refId: sale1.id,
        notes: 'Penjualan ke Toko Buah Segar',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      // Sale 2 → Mix Berry Segar: JUMBO -5, B -3, AB MIX -2
      {
        categoryId: catJumbo.id,
        movementType: 'out_sale',
        qtyKg: -5,
        refType: 'sale',
        refId: sale2.id,
        notes: 'Penjualan ke Distributor Bandung Raya (Mix Berry Segar)',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      {
        categoryId: catB.id,
        movementType: 'out_sale',
        qtyKg: -3,
        refType: 'sale',
        refId: sale2.id,
        notes: 'Penjualan ke Distributor Bandung Raya (Mix Berry Segar)',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      {
        categoryId: catAbMix.id,
        movementType: 'out_sale',
        qtyKg: -2,
        refType: 'sale',
        refId: sale2.id,
        notes: 'Penjualan ke Distributor Bandung Raya (Mix Berry Segar)',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      // Sale 2 → Berry Campuran Ekonomis: B -4.8, AB MIX -3.2
      {
        categoryId: catB.id,
        movementType: 'out_sale',
        qtyKg: -4.8,
        refType: 'sale',
        refId: sale2.id,
        notes: 'Penjualan ke Distributor Bandung Raya (Berry Campuran Ekonomis)',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      {
        categoryId: catAbMix.id,
        movementType: 'out_sale',
        qtyKg: -3.2,
        refType: 'sale',
        refId: sale2.id,
        notes: 'Penjualan ke Distributor Bandung Raya (Berry Campuran Ekonomis)',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
      // Sale 3 → B -3
      {
        categoryId: catB.id,
        movementType: 'out_sale',
        qtyKg: -3,
        refType: 'sale',
        refId: sale3.id,
        notes: 'Penjualan ke Kafe Strawberry House',
        createdById: salesUser.id,
        createdByName: salesUser.name,
      },
    ],
  })

  console.log('  ✅ InventoryMovements – out_sale (7)')

  // ═══════════════════════════════════════════════
  // 16. EXPENSES
  // ═══════════════════════════════════════════════
  const expOngkir = await prisma.expenseCategory.findUnique({
    where: { name: 'Ongkir' },
  })
  const expPembelian = await prisma.expenseCategory.findUnique({
    where: { name: 'Pembelian Kebun' },
  })

  if (expOngkir && expPembelian) {
    await prisma.expense.createMany({
      data: [
        // Ongkir for Sale 2 (seller_billed → seller pays, bills buyer)
        {
          expenseDate: new Date('2026-08-04'),
          categoryId: expOngkir.id,
          amount: 25000,
          description: 'Ongkir pengiriman ke Distributor Bandung Raya',
          relatedSaleId: sale2.id,
          isAutoGenerated: true,
          createdById: salesUser.id,
          createdByName: salesUser.name,
        },
        // Ongkir for Sale 3 (seller_free → seller absorbs cost)
        {
          expenseDate: new Date('2026-08-05'),
          categoryId: expOngkir.id,
          amount: 10000,
          description: 'Ongkir gratis ke Kafe Strawberry House (ditanggung penjual)',
          relatedSaleId: sale3.id,
          isAutoGenerated: true,
          createdById: salesUser.id,
          createdByName: salesUser.name,
        },
        // Pembelian Kebun for Receiving 1 (RH1)
        {
          expenseDate: new Date('2026-07-30'),
          categoryId: expPembelian.id,
          amount: 2775000,
          description: 'Pembelian stroberi dari Kebun Rahayu (RH1) – 100 kg',
          relatedReceivingId: receiving1.id,
          isAutoGenerated: true,
          createdById: sorterUser.id,
          createdByName: sorterUser.name,
        },
        // Pembelian Kebun for Receiving 2 (MK1)
        {
          expenseDate: new Date('2026-07-31'),
          categoryId: expPembelian.id,
          amount: 2040000,
          description: 'Pembelian stroberi dari Kebun Makmur (MK1) – 80 kg',
          relatedReceivingId: receiving2.id,
          isAutoGenerated: true,
          createdById: sorterUser.id,
          createdByName: sorterUser.name,
        },
        // Pembelian Kebun for Receiving 3 (ST1)
        {
          expenseDate: new Date('2026-08-01'),
          categoryId: expPembelian.id,
          amount: 1325000,
          description: 'Pembelian stroberi dari Kebun Sejahtera (ST1) – 60 kg',
          relatedReceivingId: receiving3.id,
          isAutoGenerated: true,
          createdById: sorterUser.id,
          createdByName: sorterUser.name,
        },
      ],
    })
  }

  console.log('  ✅ Expenses (5)')

  // ═══════════════════════════════════════════════
  // 17. ACTIVITY LOGS
  // ═══════════════════════════════════════════════
  await prisma.activityLog.createMany({
    data: [
      {
        userId: ownerUser.id,
        username: ownerUser.username,
        userName: ownerUser.name,
        role: 'owner',
        action: 'LOGIN',
        entityType: 'user',
        entityId: ownerUser.id,
        summary: 'Owner logged in to the system',
      },
      {
        userId: driverUser.id,
        username: driverUser.username,
        userName: driverUser.name,
        role: 'driver',
        action: 'CREATE_PICKUP',
        entityType: 'pickup',
        entityId: pickup1.id,
        summary: `Pengambilan dibuat: ${pickup1.sjNumber} dari Kebun Rahayu`,
        detail: { farmCode: 'RH1', trayCount: 20, farmName: 'Kebun Rahayu' },
      },
      {
        userId: sorterUser.id,
        username: sorterUser.username,
        userName: sorterUser.name,
        role: 'sorter',
        action: 'CREATE_RECEIVING',
        entityType: 'receiving',
        entityId: receiving1.id,
        summary: `Penerimaan dibuat untuk ${pickup1.sjNumber} – 100 kg`,
        detail: { totalKg: 100, totalCost: 2775000, farmCode: 'RH1' },
      },
      {
        userId: salesUser.id,
        username: salesUser.username,
        userName: salesUser.name,
        role: 'sales',
        action: 'CREATE_SALE',
        entityType: 'sale',
        entityId: sale1.id,
        summary: `Penjualan dibuat: ${sale1.invoiceNumber} – Rp 418,750`,
        detail: {
          totalAmount: 418750,
          customerId: customer1.id,
          customerName: 'Toko Buah Segar',
        },
      },
      {
        userId: sorterUser.id,
        username: sorterUser.username,
        userName: sorterUser.name,
        role: 'sorter',
        action: 'AUTO_EXPENSE',
        entityType: 'expense',
        summary: 'Pengeluaran otomatis: Pembelian Kebun Rahayu – Rp 2,775,000',
        detail: {
          receivingId: receiving1.id,
          amount: 2775000,
          categoryName: 'Pembelian Kebun',
        },
      },
    ],
  })

  console.log('  ✅ ActivityLogs (5)')

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('')
  console.log('🌱 Seed completed successfully!')
  console.log('   Users:            4 (owner, driver1, sorter1, sales1)')
  console.log('   Categories:       3 (JUMBO, B, AB MIX)')
  console.log('   Farms:            3 (RH1, MK1, ST1)')
  console.log('   FarmCategoryPrice: 9')
  console.log('   ExpenseCategories: 5')
  console.log('   Settings:          6')
  console.log('   Permissions:      52 (13 modules × 4 roles)')
  console.log('   Customers:         4')
  console.log('   Products:          4 (with recipes)')
  console.log('   Pickups:           5 (3 received, 1 pending, 1 cancelled)')
  console.log('   Receivings:        3')
  console.log('   SortingDetails:    9')
  console.log('   InventoryMovements: 16 (9 in_sorting + 7 out_sale)')
  console.log('   Sales:             3 (with invoice numbers)')
  console.log('   SaleItems:         4')
  console.log('   Expenses:          5 (2 ongkir + 3 pembelian kebun)')
  console.log('   ActivityLogs:      5')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
