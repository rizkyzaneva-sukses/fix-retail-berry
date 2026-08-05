import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, color, shrinkagePct, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description ?? null,
        color: color ?? '#e11d48',
        shrinkagePct: shrinkagePct ?? 0,
        sortOrder: sortOrder ?? 0,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_category',
        entityType: 'Category',
        entityId: category.id,
        summary: `Membuat kategori baru: ${category.name}`,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    console.error('POST /api/categories error:', err)
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}
