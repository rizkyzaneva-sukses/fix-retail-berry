import { prisma } from '@/lib/prisma'

/**
 * Generate SJ (Surat Jalan) number: DDMMYYYY + farmCode.
 * Handles collision with suffix -02, -03, etc.
 */
export async function generateSJNumber(
  farmCode: string,
  date: Date
): Promise<string> {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const base = `${dd}${mm}${yyyy}${farmCode.toUpperCase()}`

  const existing = await prisma.pickup.findFirst({
    where: {
      sjNumber: { startsWith: base },
    },
    orderBy: { sjNumber: 'desc' },
  })

  if (!existing) return base

  // Extract suffix from existing SJ number
  const suffix = existing.sjNumber.slice(base.length)
  const nextNum = suffix ? parseInt(suffix.replace('-', '')) + 1 : 2

  return `${base}-${String(nextNum).padStart(2, '0')}`
}

/**
 * Generate invoice number: INV-YYYYMMDD-{saleId:04d}
 */
export function generateInvoiceNumber(saleId: number, date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const id = String(saleId).padStart(4, '0')
  return `INV-${yyyy}${mm}${dd}-${id}`
}
