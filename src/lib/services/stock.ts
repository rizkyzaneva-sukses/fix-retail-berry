import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Get current stock for a category by summing all InventoryMovement qtyKg.
 */
export async function getCurrentStock(
  categoryId: number,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const client = tx ?? prisma
  const result = await client.inventoryMovement.aggregate({
    where: { categoryId },
    _sum: { qtyKg: true },
  })
  return result._sum.qtyKg ?? 0
}

/**
 * Reverse all inventory movements for a given refType + refId.
 * Creates opposite sign movements and logs the reversal.
 */
export async function reverseMovements(params: {
  refType: string
  refId: number
  reason: string
  createdById?: number
  createdByName?: string
}) {
  const { refType, refId, reason, createdById, createdByName } = params

  const originalMovements = await prisma.inventoryMovement.findMany({
    where: { refType, refId },
  })

  if (originalMovements.length === 0) return []

  const reversals = await Promise.all(
    originalMovements.map((m) =>
      prisma.inventoryMovement.create({
        data: {
          categoryId: m.categoryId,
          movementType: m.movementType === 'in_sorting' ? 'adjustment' : 'adjustment',
          qtyKg: -m.qtyKg,
          refType: 'reversal',
          refId: m.id,
          notes: reason,
          createdById,
          createdByName,
        },
      })
    )
  )

  return reversals
}

/**
 * Check if adding a delta to current stock would result in negative stock.
 */
export async function checkNegativeStock(
  categoryId: number,
  delta: number
): Promise<{ ok: boolean; current: number; message?: string }> {
  const current = await getCurrentStock(categoryId)
  const projected = current + delta

  if (projected < -0.001) {
    return {
      ok: false,
      current,
      message: `Stok tidak mencukupi. Stok saat ini: ${current.toFixed(2)} kg, perubahan: ${delta.toFixed(2)} kg, stok proyeksi: ${projected.toFixed(2)} kg`,
    }
  }

  return { ok: true, current }
}

/**
 * Calculate weighted average cost for a category.
 * Used for HPP (Harga Pokok Penjualan) calculation.
 */
export async function calculateWeightedAvgCost(
  categoryId: number
): Promise<number> {
  // Get all inbound movements (in_sorting) for this category
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      categoryId,
      movementType: 'in_sorting',
    },
    orderBy: { createdAt: 'asc' },
  })

  if (movements.length === 0) return 0

  // For weighted average, we need cost info from sorting details
  // linked via refType = 'receiving' and refId = receiving.id
  let totalCost = 0
  let totalQty = 0

  for (const movement of movements) {
    if (movement.refType === 'receiving' && movement.refId) {
      const sortingDetail = await prisma.sortingDetail.findFirst({
        where: {
          receivingId: movement.refId,
          categoryId,
        },
      })

      if (sortingDetail) {
        totalCost += sortingDetail.totalCost
        totalQty += sortingDetail.kg
      }
    }
  }

  if (totalQty <= 0) return 0
  return totalCost / totalQty
}
