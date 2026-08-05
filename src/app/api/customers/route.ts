import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(customers)
  } catch (err) {
    console.error('GET /api/customers error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data pelanggan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, address, notes, defaultDiscountPct } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama pelanggan wajib diisi' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone ?? null,
        address: address ?? null,
        notes: notes ?? null,
        defaultDiscountPct: defaultDiscountPct ?? 0,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_customer',
        entityType: 'Customer',
        entityId: customer.id,
        summary: `Membuat pelanggan baru: ${customer.name}`,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (err) {
    console.error('POST /api/customers error:', err)
    return NextResponse.json({ error: 'Gagal membuat pelanggan' }, { status: 500 })
  }
}
