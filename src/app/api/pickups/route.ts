import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateSJNumber } from '@/lib/services/sj'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const farmId = searchParams.get('farmId')
    const driverId = searchParams.get('driverId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (farmId) where.farmId = parseInt(farmId)
    if (driverId) where.driverId = parseInt(driverId)
    if (dateFrom || dateTo) {
      where.pickupDate = {}
      if (dateFrom) where.pickupDate.gte = new Date(dateFrom)
      if (dateTo) where.pickupDate.lte = new Date(dateTo)
    }

    const [pickups, total] = await Promise.all([
      prisma.pickup.findMany({
        where,
        include: {
          farm: true,
          driver: { select: { id: true, name: true, username: true } },
          receiving: true,
        },
        orderBy: { pickupDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pickup.count({ where }),
    ])

    return NextResponse.json({
      data: pickups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('GET /api/pickups error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data pickup' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { farmId, pickupDate, trayCount, driverId, notes, photoUrl } = body

    if (!farmId || !pickupDate || !trayCount) {
      return NextResponse.json(
        { error: 'Farm, tanggal pickup, dan jumlah tray wajib diisi' },
        { status: 400 }
      )
    }

    // 1 farm = 1 pickup per day (check existing active pickup)
    const date = new Date(pickupDate)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingActive = await prisma.pickup.findFirst({
      where: {
        farmId: parseInt(farmId),
        pickupDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' },
      },
    })

    if (existingActive) {
      return NextResponse.json(
        { error: `Kebun sudah memiliki pickup aktif pada tanggal ini (SJ: ${existingActive.sjNumber})` },
        { status: 409 }
      )
    }

    // Get farm code for SJ number generation
    const farm = await prisma.farm.findUnique({ where: { id: parseInt(farmId) } })
    if (!farm) {
      return NextResponse.json({ error: 'Kebun tidak ditemukan' }, { status: 404 })
    }

    const sjNumber = await generateSJNumber(farm.code, date)

    const pickup = await prisma.pickup.create({
      data: {
        farmId: parseInt(farmId),
        driverId: driverId ? parseInt(driverId) : user.id,
        pickupDate: date,
        trayCount: parseInt(trayCount),
        sjNumber,
        notes: notes ?? null,
        photoUrl: photoUrl ?? null,
        barcodeData: sjNumber,
      },
      include: {
        farm: true,
        driver: { select: { id: true, name: true, username: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_pickup',
        entityType: 'Pickup',
        entityId: pickup.id,
        summary: `Membuat pickup baru: SJ ${pickup.sjNumber} - ${farm.name} (${trayCount} tray)`,
      },
    })

    return NextResponse.json(pickup, { status: 201 })
  } catch (err) {
    console.error('POST /api/pickups error:', err)
    return NextResponse.json({ error: 'Gagal membuat pickup' }, { status: 500 })
  }
}
