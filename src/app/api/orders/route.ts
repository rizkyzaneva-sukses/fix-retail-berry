import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/services/sj'
import { calculateWeightedAvgCost } from '@/lib/services/stock'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = parseInt(customerId)
    if (dateFrom || dateTo) {
      where.saleDate = {}
      if (dateFrom) where.saleDate.gte = new Date(dateFrom)
      if (dateTo) where.saleDate.lte = new Date(dateTo)
    }

    const [orders, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('GET /api/orders error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data pesanan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerId,
      saleDate,
      items,
      discountAmount,
      shippingMethod,
      shippingPayer,
      shippingCost,
      notes,
    } = body

    if (!customerId || !saleDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'customerId, saleDate, dan items wajib diisi' },
        { status: 400 }
      )
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } })
    if (!customer) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })
    }

    // CRITICAL: Validate stock ALL-OR-NOTHING
    const stockValidationErrors: string[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
        include: { recipes: { include: { category: true } } },
      })

      if (!product) {
        stockValidationErrors.push(`Produk ID ${item.productId} tidak ditemukan`)
        continue
      }

      for (const recipe of product.recipes) {
        const stockNeeded = item.qtyKg * recipe.ratio
        // Include shrinkage tolerance
        const shrinkageMultiplier = 1 + (recipe.category.shrinkagePct / 100)
        const actualNeeded = stockNeeded * shrinkageMultiplier

        const movements = await prisma.inventoryMovement.aggregate({
          where: { categoryId: recipe.categoryId },
          _sum: { qtyKg: true },
        })
        const currentStock = movements._sum.qtyKg ?? 0

        if (currentStock < actualNeeded - 0.001) {
          stockValidationErrors.push(
            `Stok ${recipe.category.name} tidak mencukupi untuk ${product.name}: ` +
            `dibutuhkan ${actualNeeded.toFixed(2)} kg (termasuk shrinkage ${recipe.category.shrinkagePct}%), ` +
            `tersedia ${currentStock.toFixed(2)} kg`
          )
        }
      }
    }

    if (stockValidationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Stok tidak mencukupi untuk pesanan ini',
          details: stockValidationErrors,
        },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = 0
    const saleItemsData: any[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } })
      const itemSubtotal = item.qtyKg * (item.unitPrice ?? product?.basePrice ?? 0)
      subtotal += itemSubtotal
      saleItemsData.push({
        productId: parseInt(item.productId),
        qtyKg: item.qtyKg,
        unitPrice: item.unitPrice ?? product?.basePrice ?? 0,
        subtotal: itemSubtotal,
      })
    }

    const totalAmount = subtotal - (discountAmount ?? 0) + (shippingCost ?? 0)

    // CRITICAL TRANSACTION: All-or-nothing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale (status=confirmed)
      const sale = await tx.sale.create({
        data: {
          customerId: parseInt(customerId),
          saleDate: new Date(saleDate),
          subtotal,
          discountAmount: discountAmount ?? 0,
          shippingMethod: shippingMethod ?? null,
          shippingPayer: shippingPayer ?? 'buyer_direct',
          shippingCost: shippingCost ?? 0,
          totalAmount,
          status: 'confirmed',
          notes: notes ?? null,
          createdById: user.id,
        },
      })

      // 2. Generate invoiceNumber
      const invoiceNumber = generateInvoiceNumber(sale.id, new Date(saleDate))
      await tx.sale.update({
        where: { id: sale.id },
        data: { invoiceNumber },
      })

      // 3. Create SaleItem per row
      const saleItems = await Promise.all(
        saleItemsData.map((item) =>
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              qtyKg: item.qtyKg,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            },
          })
        )
      )

      // 4. Create InventoryMovement(out_sale, -stockNeeded) per category
      const movements: any[] = []
      let totalCogs = 0

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId) },
          include: { recipes: { include: { category: true } } },
        })

        if (!product) continue

        for (const recipe of product.recipes) {
          const stockNeeded = item.qtyKg * recipe.ratio
          const shrinkageMultiplier = 1 + (recipe.category.shrinkagePct / 100)
          const actualNeeded = stockNeeded * shrinkageMultiplier

          // 5. Calculate weighted avg cost for COGS
          const weightedCost = await calculateWeightedAvgCost(recipe.categoryId)
          totalCogs += actualNeeded * weightedCost

          const movement = await tx.inventoryMovement.create({
            data: {
              categoryId: recipe.categoryId,
              movementType: 'out_sale',
              qtyKg: -actualNeeded,
              refType: 'sale',
              refId: sale.id,
              notes: `Penjualan ${invoiceNumber} - ${product.name}`,
              createdById: user.id,
              createdByName: user.name,
            },
          })
          movements.push(movement)
        }
      }

      // 6. Save totalCogs
      await tx.sale.update({
        where: { id: sale.id },
        data: { totalCogs },
      })

      // 7. Create shipping Expense if applicable
      if (
        (shippingPayer === 'seller_billed' || shippingPayer === 'seller_free') &&
        shippingCost &&
        shippingCost > 0
      ) {
        const expenseCategory = await tx.expenseCategory.findFirst({
          where: { name: 'Biaya Pengiriman' },
        })

        if (expenseCategory) {
          await tx.expense.create({
            data: {
              expenseDate: new Date(saleDate),
              categoryId: expenseCategory.id,
              amount: shippingCost,
              description: `Biaya pengiriman ${invoiceNumber}`,
              relatedSaleId: sale.id,
              isAutoGenerated: true,
              createdById: user.id,
              createdByName: user.name,
            },
          })
        }
      }

      return { sale: { ...sale, invoiceNumber }, saleItems, movements, totalCogs }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_order',
        entityType: 'Sale',
        entityId: result.sale.id,
        summary: `Membuat pesanan ${result.sale.invoiceNumber} - ${customer.name} - Rp ${totalAmount.toLocaleString('id-ID')}`,
      },
    })

    // Return full order
    const fullOrder = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json(fullOrder, { status: 201 })
  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
  }
}
