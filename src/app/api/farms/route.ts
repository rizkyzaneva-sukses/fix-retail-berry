import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const farms = await prisma.farm.findMany({
      where: { isActive: true },
      include: {
        prices: {
          orderBy: { effectiveFrom: 'desc' },
          include: { category: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(farms)
  } catch (err) {
    console.error('GET /api/farms error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data kebun' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, code, location } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Nama dan kode kebun wajib diisi' }, { status: 400 })
    }

    if (code.length > 10) {
      return NextResponse.json({ error: 'Kode kebun maksimal 10 karakter' }, { status: 400 })
    }

    const upperCode = code.toUpperCase()

    // Check uniqueness
    const existing = await prisma.farm.findFirst({
      where: { OR: [{ name }, { code: upperCode }] },
    })
    if (existing) {
      return NextResponse.json({ error: 'Nama atau kode kebun sudah ada' }, { status: 409 })
    }

    const farm = await prisma.farm.create({
      data: {
        name,
        code: upperCode,
        location: location ?? null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_farm',
        entityType: 'Farm',
        entityId: farm.id,
        summary: `Membuat kebun baru: ${farm.name} (${farm.code})`,
      },
    })

    return NextResponse.json(farm, { status: 201 })
  } catch (err) {
    console.error('POST /api/farms error:', err)
    return NextResponse.json({ error: 'Gagal membuat kebun' }, { status: 500 })
  }
}
