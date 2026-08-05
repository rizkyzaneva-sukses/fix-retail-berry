import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { reverseMovements } from '@/lib/services/stock'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pickup = await prisma.pickup.findUnique({
      where: { id: parseInt(id) },
      include: {
        farm: true,
        driver: { select: { id: true, name: true, username: true } },
        receiving: {
          include: {
            sortingDetails: {
              include: { category: true },
            },
          },
        },
      },
    })

    if (!pickup) {
      return NextResponse.json({ error: 'Pickup tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(pickup)
  } catch (err) {
    console.error('GET /api/pickups/[id] error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data pickup' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const pickupId = parseInt(id)
    const body = await req.json()
    const { farmId, pickupDate, trayCount, driverId, notes, photoUrl } = body

    const existing = await prisma.pickup.findUnique({ where: { id: pickupId } })
    if (!existing) {
      return NextResponse.json({ error: 'Pickup tidak ditemukan' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Hanya pickup dengan status pending yang dapat diubah' },
        { status: 400 }
      )
    }

    // Re-validate farm+date conflict if farm or date changed
    const newFarmId = farmId ? parseInt(farmId) : existing.farmId
    const newDate = pickupDate ? new Date(pickupDate) : existing.pickupDate

    if (farmId || pickupDate) {
      const startOfDay = new Date(newDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(newDate)
      endOfDay.setHours(23, 59, 59, 999)

      const conflict = await prisma.pickup.findFirst({
        where: {
          farmId: newFarmId,
          pickupDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'cancelled' },
          id: { not: pickupId },
        },
      })

      if (conflict) {
        return NextResponse.json(
          { error: `Kebun sudah memiliki pickup aktif pada tanggal ini (SJ: ${conflict.sjNumber})` },
          { status: 409 }
        )
      }
    }

    const pickup = await prisma.pickup.update({
      where: { id: pickupId },
      data: {
        ...(farmId && { farmId: newFarmId }),
        ...(pickupDate && { pickupDate: newDate }),
        ...(trayCount && { trayCount: parseInt(trayCount) }),
        ...(driverId && { driverId: parseInt(driverId) }),
        ...(notes !== undefined && { notes }),
        ...(photoUrl !== undefined && { photoUrl }),
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
        action: 'update_pickup',
        entityType: 'Pickup',
        entityId: pickup.id,
        summary: `Memperbarui pickup: SJ ${pickup.sjNumber}`,
      },
    })

    return NextResponse.json(pickup)
  } catch (err) {
    console.error('PUT /api/pickups/[id] error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui pickup' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const pickupId = parseInt(id)

    const existing = await prisma.pickup.findUnique({
      where: { id: pickupId },
      include: { receiving: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Pickup tidak ditemukan' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Hanya pickup dengan status pending yang dapat dibatalkan' },
        { status: 400 }
      )
    }

    // If has receiving, do full stock rollback
    if (existing.receiving) {
      await reverseMovements({
        refType: 'receiving',
        refId: existing.receiving.id,
        reason: `Pembatalan pickup SJ ${existing.sjNumber} - rollback stok`,
        createdById: user.id,
        createdByName: user.name,
      })

      // Delete related expense
      await prisma.expense.deleteMany({
        where: { relatedReceivingId: existing.receiving.id },
      })

      // Delete receiving and sorting details
      await prisma.sortingDetail.deleteMany({
        where: { receivingId: existing.receiving.id },
      })
      await prisma.receiving.delete({
        where: { id: existing.receiving.id },
      })
    }

    // Cancel pickup
    await prisma.pickup.update({
      where: { id: pickupId },
      data: { status: 'cancelled' },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'cancel_pickup',
        entityType: 'Pickup',
        entityId: pickupId,
        summary: `Membatalkan pickup: SJ ${existing.sjNumber}${existing.receiving ? ' (dengan rollback stok)' : ''}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/pickups/[id] error:', err)
    return NextResponse.json({ error: 'Gagal membatalkan pickup' }, { status: 500 })
  }
}
