import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const farm = await prisma.farm.findUnique({
      where: { id: parseInt(id) },
      include: {
        prices: {
          orderBy: { effectiveFrom: 'desc' },
          include: { category: true },
        },
      },
    })

    if (!farm) {
      return NextResponse.json({ error: 'Kebun tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(farm)
  } catch (err) {
    console.error('GET /api/farms/[id] error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data kebun' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const farmId = parseInt(id)
    const body = await req.json()
    const { name, code, location } = body

    const existing = await prisma.farm.findUnique({ where: { id: farmId } })
    if (!existing) {
      return NextResponse.json({ error: 'Kebun tidak ditemukan' }, { status: 404 })
    }

    const upperCode = code ? code.toUpperCase() : existing.code
    if (upperCode.length > 10) {
      return NextResponse.json({ error: 'Kode kebun maksimal 10 karakter' }, { status: 400 })
    }

    // Check uniqueness if changed
    if (name || code) {
      const conflict = await prisma.farm.findFirst({
        where: {
          id: { not: farmId },
          OR: [
            ...(name ? [{ name }] : []),
            ...(code ? [{ code: upperCode }] : []),
          ],
        },
      })
      if (conflict) {
        return NextResponse.json({ error: 'Nama atau kode kebun sudah ada' }, { status: 409 })
      }
    }

    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: {
        ...(name && { name }),
        code: upperCode,
        ...(location !== undefined && { location }),
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'update_farm',
        entityType: 'Farm',
        entityId: farm.id,
        summary: `Memperbarui kebun: ${farm.name} (${farm.code})`,
      },
    })

    return NextResponse.json(farm)
  } catch (err) {
    console.error('PUT /api/farms/[id] error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui kebun' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const farmId = parseInt(id)

    const existing = await prisma.farm.findUnique({ where: { id: farmId } })
    if (!existing) {
      return NextResponse.json({ error: 'Kebun tidak ditemukan' }, { status: 404 })
    }

    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: { isActive: false },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'delete_farm',
        entityType: 'Farm',
        entityId: farm.id,
        summary: `Menonaktifkan kebun: ${farm.name} (${farm.code})`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/farms/[id] error:', err)
    return NextResponse.json({ error: 'Gagal menghapus kebun' }, { status: 500 })
  }
}
