import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const users = [
    { username: 'owner', name: 'Owner', role: 'owner' as const, password: 'owner123' },
    { username: 'driver1', name: 'Driver 1', role: 'driver' as const, password: 'driver123' },
    { username: 'sorter1', name: 'Sorter 1', role: 'sorter' as const, password: 'sorter123' },
    { username: 'sales1', name: 'Sales 1', role: 'sales' as const, password: 'sales123' },
  ]
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, name: u.name, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) },
    })
  }

  // Permissions
  const modules = ['dashboard','pengambilan','penerimaan','stok','produk','penjualan','retur','keuangan','master_data','laporan','log','panduan','profil']
  const perms: Record<string, boolean[]> = {
    owner:  modules.map(() => true),
    driver: modules.map(m => ['dashboard','pengambilan','stok','panduan','profil'].includes(m)),
    sorter: modules.map(m => ['dashboard','penerimaan','stok','panduan','profil'].includes(m)),
    sales:  modules.map(m => ['dashboard','stok','produk','penjualan','retur','laporan','panduan','profil'].includes(m)),
  }
  for (const role of ['owner','driver','sorter','sales'] as const) {
    for (let i = 0; i < modules.length; i++) {
      await prisma.permission.upsert({
        where: { role_module: { role, module: modules[i] } },
        update: { canView: perms[role][i], canCreate: perms[role][i], canEdit: role === 'owner', canDelete: role === 'owner', canApprove: role === 'owner' },
        create: { role, module: modules[i], canView: perms[role][i], canCreate: perms[role][i], canEdit: role === 'owner', canDelete: role === 'owner', canApprove: role === 'owner' },
      })
    }
  }

  // Expense categories
  for (const cat of [
    { name: 'Ongkir', icon: '🚚', sortOrder: 1, isSystem: true },
    { name: 'Pembelian Kebun', icon: '🌱', sortOrder: 2, isSystem: true },
    { name: 'Operasional', icon: '⚙️', sortOrder: 3 },
    { name: 'Gaji', icon: '💰', sortOrder: 4 },
    { name: 'Lain-lain', icon: '📦', sortOrder: 99 },
  ]) {
    await prisma.expenseCategory.upsert({ where: { name: cat.name }, update: {}, create: cat })
  }

  // Settings
  for (const s of [
    { key: 'company_name', value: 'Strawberry Fresh Supply' },
    { key: 'receiving_tolerance_kg', value: '0.15' },
    { key: 'default_shrinkage_pct', value: '0' },
    { key: 'waha_enabled', value: 'false' },
    { key: 'waha_url', value: 'http://localhost:3000' },
    { key: 'waha_session', value: 'default' },
  ]) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s })
  }

  // Categories
  for (const cat of [
    { name: 'JUMBO', color: '#e11d48', sortOrder: 1, shrinkagePct: 2 },
    { name: 'B', color: '#f59e0b', sortOrder: 2, shrinkagePct: 1 },
    { name: 'AB MIX', color: '#22c55e', sortOrder: 3, shrinkagePct: 0 },
  ]) {
    await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: cat })
  }

  // Farms
  for (const f of [
    { name: 'Kebun Rahayu', code: 'RH1', location: 'Lembang' },
    { name: 'Kebun Makmur', code: 'MK1', location: 'Ciwidey' },
  ]) {
    await prisma.farm.upsert({ where: { name: f.name }, update: {}, create: f })
  }

  console.log('✅ Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
