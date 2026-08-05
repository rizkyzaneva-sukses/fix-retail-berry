import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getFarmPrice } from '@/lib/services/pricing'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pickupId = searchParams.get('pickupId')
    const sortBy = searchParams.get('sortBy') || 'checkDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (pickupId) where.pickupId = parseInt(pickupId)

    const [receivings, total] = await Promise.all([
      prisma.receiving.findMany({
        where,
        include: {
          pickup: {
            include: {
              farm: true,
              driver: { select: { id: true, name: true } },
            },
          },
          sortingDetails: {
            include: { category: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.receiving.count({ where }),
    ])

    return NextResponse.json({
      data: receivings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('GET /api/receiving error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data penerimaan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pickupId, totalKg, notes, photoUrl, items, balanceOverride } = body

    if (!pickupId || !totalKg || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'pickupId, totalKg, dan items wajib diisi' },
        { status: 400 }
      )
    }

    // Guard: pickup must be pending and not already have a receiving
    const pickup = await prisma.pickup.findUnique({
      where: { id: parseInt(pickupId) },
      include: { receiving: true },
    })

    if (!pickup) {
      return NextResponse.json({ error: 'Pickup tidak ditemukan' }, { status: 404 })
    }

    if (pickup.status !== 'pending') {
      return NextResponse.json(
        { error: `Pickup status harus pending (saat ini: ${pickup.status})` },
        { status: 400 }
      )
    }

    if (pickup.receiving) {
      return NextResponse.json(
        { error: 'Pickup sudah memiliki data penerimaan' },
        { status: 409 }
      )
    }

    // Calculate sortedTotal from items
    const sortedTotal = items.reduce((sum: number, item: any) => sum + (item.kg || 0), 0)

    // Check balance vs totalKg within tolerance (0.5 kg)
    const tolerance = 0.5
    const isBalanced = Math.abs(sortedTotal - totalKg) <= tolerance

    if (!isBalanced && !balanceOverride) {
      return NextResponse.json(
        {
          error: `Selisih melebihi toleransi. Total sortir: ${sortedTotal.toFixed(2)} kg, Total diterima: ${totalKg.toFixed(2)} kg, Selisih: ${Math.abs(sortedTotal - totalKg).toFixed(2)} kg`,
          sortedTotal,
          receivedTotal: totalKg,
          difference: Math.abs(sortedTotal - totalKg),
          requiresOverride: true,
        },
        { status: 400 }
      )
    }

    // Owner can override balance
    if (!isBalanced && balanceOverride && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Hanya owner yang dapat melakukan override selisih' },
        { status: 403 }
      )
    }

    // Get pickup date for price lookup
    const pickupDate = new Date(pickup.pickupDate)

    // Build sorting details with unitCost snapshot
    const sortingDetailsData = await Promise.all(
      items.map(async (item: any) => {
        const unitCost = await getFarmPrice(pickup.farmId, item.categoryId, pickupDate)
        return {
          categoryId: parseInt(item.categoryId),
          kg: item.kg,
          percentage: totalKg > 0 ? (item.kg / totalKg) * 100 : 0,
          unitCost,
          totalCost: item.kg * unitCost,
        }
      })
    )

    const totalCost = sortingDetailsData.reduce((sum, d) => sum + d.totalCost, 0)

    // CRITICAL TRANSACTION: All-or-nothing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Receiving
      const receiving = await tx.receiving.create({
        data: {
          pickupId: parseInt(pickupId),
          totalKg,
          checkedById: user.id,
          checkedByName: user.name,
          notes: notes ?? null,
          isBalanced,
          photoUrl: photoUrl ?? null,
          totalCost,
        },
      })

      // 2. Create SortingDetail per category (with unitCost snapshot)
      const sortingDetails = await Promise.all(
        sortingDetailsData.map((d) =>
          tx.sortingDetail.create({
            data: {
              receivingId: receiving.id,
              categoryId: d.categoryId,
              kg: d.kg,
              percentage: d.percentage,
              unitCost: d.unitCost,
              totalCost: d.totalCost,
            },
          })
        )
      )

      // 3. Create InventoryMovement(in_sorting) per category
      const movements = await Promise.all(
        sortingDetailsData.map((d) =>
          tx.inventoryMovement.create({
            data: {
              categoryId: d.categoryId,
              movementType: 'in_sorting',
              qtyKg: d.kg,
              refType: 'receiving',
              refId: receiving.id,
              notes: `Penerimaan dari pickup SJ ${pickup.sjNumber}`,
              createdById: user.id,
              createdByName: user.name,
            },
          })
        )
      )

      // 4. Set Pickup.status = 'received'
      await tx.pickup.update({
        where: { id: parseInt(pickupId) },
        data: { status: 'received' },
      })

      // 5. Auto-create Expense for 'Pembelian Kebun'
      const expenseCategory = await tx.expenseCategory.findFirst({
        where: { name: 'Pembelian Kebun' },
      })

      if (expenseCategory) {
        await tx.expense.create({
          data: {
            expenseDate: pickupDate,
            categoryId: expenseCategory.id,
            amount: totalCost,
            description: `Pembelian kebun ${pickup.sjNumber} - ${totalKg} kg`,
            relatedReceivingId: receiving.id,
            isAutoGenerated: true,
            createdById: user.id,
            createdByName: user.name,
          },
        })
      }

      // Log override if applicable
      if (!isBalanced && balanceOverride) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            username: user.username,
            userName: user.name,
            role: user.role,
            action: 'override_balance',
            entityType: 'Receiving',
            entityId: receiving.id,
            summary: `Override selisih penerimaan: sortir ${sortedTotal.toFixed(2)} kg vs diterima ${totalKg} kg`,
            detail: JSON.stringify({
              sortedTotal,
              receivedTotal: totalKg,
              difference: sortedTotal - totalKg,
              overrideBy: user.name,
            }),
          },
        })
      }

      return { receiving, sortingDetails, movements }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_receiving',
        entityType: 'Receiving',
        entityId: result.receiving.id,
        summary: `Menerima pickup ${pickup.sjNumber}: ${totalKg} kg, Rp ${totalCost.toLocaleString('id-ID')}`,
      },
    })

    // Return full data
    const fullReceiving = await prisma.receiving.findUnique({
      where: { id: result.receiving.id },
      include: {
        sortingDetails: { include: { category: true } },
        pickup: { include: { farm: true } },
      },
    })

    return NextResponse.json(fullReceiving, { status: 201 })
  } catch (err) {
    console.error('POST /api/receiving error:', err)
    return NextResponse.json({ error: 'Gagal membuat data penerimaan' }, { status: 500 })
  }
}
