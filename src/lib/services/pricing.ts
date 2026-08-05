import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Get the effective farm price for a given farm, category, and date.
 * Returns the most recent price where effectiveFrom <= date.
 */
export async function getFarmPrice(
  farmId: number,
  categoryId: number,
  date: Date
): Promise<number> {
  const price = await prisma.farmCategoryPrice.findFirst({
    where: {
      farmId,
      categoryId,
      effectiveFrom: { lte: date },
    },
    orderBy: { effectiveFrom: 'desc' },
  })

  return price?.pricePerKg ?? 0
}

/**
 * Calculate COGS (Cost of Goods Sold) for a sale.
 * Sums stockNeeded * weightedAvgCost per category across all items.
 */
export async function calculateCOGS(saleId: number): Promise<number> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: {
            include: { recipes: true },
          },
        },
      },
    },
  })

  if (!sale) return 0

  let totalCogs = 0

  for (const item of sale.items) {
    const product = item.product
    let itemCogs = 0

    for (const recipe of product.recipes) {
      const stockNeeded = item.qtyKg * recipe.ratio
      const weightedCost = await calculateWeightedAvgCost(recipe.categoryId)
      itemCogs += stockNeeded * weightedCost
    }

    totalCogs += itemCogs
  }

  return totalCogs
}

/**
 * Calculate weighted average cost for a category (internal helper).
 */
async function calculateWeightedAvgCost(categoryId: number): Promise<number> {
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      categoryId,
      movementType: 'in_sorting',
    },
    orderBy: { createdAt: 'asc' },
  })

  if (movements.length === 0) return 0

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
