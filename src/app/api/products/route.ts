import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        recipes: {
          include: { category: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, productType, basePrice, description, imageUrl, recipes } = body

    if (!name) {
      return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 })
    }

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: 'Resep produk wajib diisi' }, { status: 400 })
    }

    // Validate total ratio = 1.0
    const totalRatio = recipes.reduce((sum: number, r: any) => sum + (r.ratio || 0), 0)
    if (Math.abs(totalRatio - 1.0) > 0.001) {
      return NextResponse.json(
        { error: `Total rasio resep harus 1.0 (saat ini: ${totalRatio.toFixed(4)})` },
        { status: 400 }
      )
    }

    // Check duplicate name
    const existing = await prisma.product.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Nama produk sudah ada' }, { status: 409 })
    }

    // If role is 'sales', set approvalStatus to 'pending'
    const approvalStatus = user.role === 'sales' ? 'pending' : 'approved'

    const product = await prisma.product.create({
      data: {
        name,
        productType: productType ?? 'pure',
        basePrice: basePrice ?? 0,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        approvalStatus: approvalStatus as any,
        createdBy: user.name,
        recipes: {
          create: recipes.map((r: any) => ({
            categoryId: r.categoryId,
            ratio: r.ratio,
          })),
        },
      },
      include: {
        recipes: { include: { category: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_product',
        entityType: 'Product',
        entityId: product.id,
        summary: `Membuat produk baru: ${product.name} (Status: ${approvalStatus})`,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 })
  }
}
