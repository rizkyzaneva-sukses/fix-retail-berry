import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const movementsParam = searchParams.get('movements')

    if (movementsParam === 'true') {
      // Return paginated movement history
      const type = searchParams.get('type')
      const categoryId = searchParams.get('categoryId')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      const userId = searchParams.get('userId')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const skip = (page - 1) * limit

      const where: any = {}
      if (type) where.movementType = type
      if (categoryId) where.categoryId = parseInt(categoryId)
      if (userId) where.createdById = parseInt(userId)
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) where.createdAt.lte = new Date(dateTo)
      }

      const [movements, total] = await Promise.all([
        prisma.inventoryMovement.findMany({
          where,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.inventoryMovement.count({ where }),
      ])

      return NextResponse.json({
        data: movements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // Default: Return current stock per category
    const stockCards = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        movements: {
          select: { qtyKg: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const result = stockCards.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      shrinkagePct: cat.shrinkagePct,
      currentStock: cat.movements.reduce((sum, m) => sum + m.qtyKg, 0),
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/stock error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data stok' }, { status: 500 })
  }
}
