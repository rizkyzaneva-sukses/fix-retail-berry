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
    const { categoryId, qty, notes, reason } = body

    if (!categoryId || qty === undefined || qty === null) {
      return NextResponse.json({ error: 'categoryId dan qty wajib diisi' }, { status: 400 })
    }

    if (qty === 0) {
      return NextResponse.json({ error: 'Qty tidak boleh 0' }, { status: 400 })
    }

    // If user role is 'sorter', create ChangeRequest instead
    if (user.role === 'sorter') {
      const changeRequest = await prisma.changeRequest.create({
        data: {
          entityType: 'InventoryMovement',
          entityId: 0,
          requestType: 'stock_adjustment',
          payload: JSON.stringify({ categoryId, qty, notes, reason }),
          reason: reason ?? `Adjustment stok: ${qty} kg`,
          requestedById: user.id,
          requestedByName: user.name,
          status: 'pending',
        },
      })

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          username: user.username,
          userName: user.name,
          role: user.role,
          action: 'request_adjustment',
          entityType: 'ChangeRequest',
          entityId: changeRequest.id,
          summary: `Request adjustment stok kategori ${categoryId}: ${qty} kg`,
        },
      })

      return NextResponse.json({
        message: 'Request adjustment dikirim untuk persetujuan owner',
        changeRequest,
      })
    }

    // Owner可以直接adjust
    // Guard: currentStock + qty >= -0.001 (negative stock guard)
    const check = await checkNegativeStock(parseInt(categoryId), qty)
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 })
    }

    // Create InventoryMovement
    const movement = await prisma.inventoryMovement.create({
      data: {
        categoryId: parseInt(categoryId),
        movementType: 'adjustment',
        qtyKg: qty,
        refType: 'adjustment',
        notes: notes ?? `Adjustment oleh ${user.name}: ${qty} kg`,
        createdById: user.id,
        createdByName: user.name,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'adjust_stock',
        entityType: 'InventoryMovement',
        entityId: movement.id,
        summary: `Adjustment stok kategori ${categoryId}: ${qty > 0 ? '+' : ''}${qty} kg (stok: ${check.current + qty} kg)`,
        detail: JSON.stringify({
          categoryId,
          qty,
          previousStock: check.current,
          newStock: check.current + qty,
          reason,
        }),
      },
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (err) {
    console.error('POST /api/stock/adjust error:', err)
    return NextResponse.json({ error: 'Gagal melakukan adjustment stok' }, { status: 500 })
  }
}
