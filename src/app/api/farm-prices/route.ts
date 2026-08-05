import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const farmId = searchParams.get('farmId')
    const categoryId = searchParams.get('categoryId')

    const where: any = {}
    if (farmId) where.farmId = parseInt(farmId)
    if (categoryId) where.categoryId = parseInt(categoryId)

    const prices = await prisma.farmCategoryPrice.findMany({
      where,
      include: {
        farm: true,
        category: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    })

    return NextResponse.json(prices)
  } catch (err) {
    console.error('GET /api/farm-prices error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data harga kebun' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { farmId, categoryId, pricePerKg, effectiveFrom } = body

    if (!farmId || !categoryId || pricePerKg === undefined || !effectiveFrom) {
      return NextResponse.json(
        { error: 'farmId, categoryId, pricePerKg, dan effectiveFrom wajib diisi' },
        { status: 400 }
      )
    }

    if (pricePerKg < 0) {
      return NextResponse.json({ error: 'Harga per kg tidak boleh negatif' }, { status: 400 })
    }

    // Check uniqueness
    const existing = await prisma.farmCategoryPrice.findUnique({
      where: {
        farmId_categoryId_effectiveFrom: {
          farmId: parseInt(farmId),
          categoryId: parseInt(categoryId),
          effectiveFrom: new Date(effectiveFrom),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Harga untuk kebun, kategori, dan tanggal ini sudah ada' },
        { status: 409 }
      )
    }

    const price = await prisma.farmCategoryPrice.create({
      data: {
        farmId: parseInt(farmId),
        categoryId: parseInt(categoryId),
        pricePerKg,
        effectiveFrom: new Date(effectiveFrom),
        createdBy: user.name,
      },
      include: {
        farm: true,
        category: true,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_farm_price',
        entityType: 'FarmCategoryPrice',
        entityId: price.id,
        summary: `Set harga kebun ${price.farm.name} - ${price.category.name}: Rp ${pricePerKg.toLocaleString('id-ID')}/kg (efektif ${effectiveFrom})`,
      },
    })

    return NextResponse.json(price, { status: 201 })
  } catch (err) {
    console.error('POST /api/farm-prices error:', err)
    return NextResponse.json({ error: 'Gagal membuat harga kebun' }, { status: 500 })
  }
}
