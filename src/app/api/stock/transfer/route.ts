import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentStock, checkNegativeStock } from '@/lib/services/stock'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fromCategoryId, toCategoryId, qty, notes } = body

    if (!fromCategoryId || !toCategoryId || !qty) {
      return NextResponse.json(
        { error: 'fromCategoryId, toCategoryId, dan qty wajib diisi' },
        { status: 400 }
      )
    }

    if (fromCategoryId === toCategoryId) {
      return NextResponse.json(
        { error: 'Kategori sumber dan tujuan harus berbeda' },
        { status: 400 }
      )
    }

    if (qty <= 0) {
      return NextResponse.json({ error: 'Qty harus lebih dari 0' }, { status: 400 })
    }

    // Guard: source stock >= qty
    const sourceStock = await getCurrentStock(parseInt(fromCategoryId))
    if (sourceStock < qty - 0.001) {
      return NextResponse.json(
        { error: `Stok sumber tidak mencukupi. Stok saat ini: ${sourceStock.toFixed(2)} kg, diminta: ${qty} kg` },
        { status: 400 }
      )
    }

    // Create 2 movements (negative from source, positive to destination)
    const [fromMovement, toMovement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          categoryId: parseInt(fromCategoryId),
          movementType: 'adjustment',
          qtyKg: -qty,
          refType: 'transfer',
          notes: notes ?? `Transfer dari kategori ${fromCategoryId} ke ${toCategoryId}`,
          createdById: user.id,
          createdByName: user.name,
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          categoryId: parseInt(toCategoryId),
          movementType: 'adjustment',
          qtyKg: qty,
          refType: 'transfer',
          notes: notes ?? `Transfer dari kategori ${fromCategoryId} ke ${toCategoryId}`,
          createdById: user.id,
          createdByName: user.name,
        },
      }),
    ])

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'transfer_stock',
        entityType: 'InventoryMovement',
        entityId: fromMovement.id,
        summary: `Transfer stok ${qty} kg dari kategori ${fromCategoryId} ke ${toCategoryId}`,
        detail: JSON.stringify({
          fromCategoryId,
          toCategoryId,
          qty,
          fromMovementId: fromMovement.id,
          toMovementId: toMovement.id,
        }),
      },
    })

    return NextResponse.json(
      { fromMovement, toMovement, message: `Transfer ${qty} kg berhasil` },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/stock/transfer error:', err)
    return NextResponse.json({ error: 'Gagal melakukan transfer stok' }, { status: 500 })
  }
}
