import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { apiSuccess, apiError, calculateSOH } from '@/lib/utils'

// GET /api/inventory — semua produk + SOH terhitung
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) return apiError('Unauthorized', 401)

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') || ''
  const belowRop = searchParams.get('belowRop') === 'true'

  // Fetch all active products
  const products = await prisma.masterProduct.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: { category: true },
    orderBy: { sku: 'asc' },
  })

  // Fetch all ledger entries and active PO items for these SKUs
  const skus = products.map(p => p.sku)
  const [ledger, poItems] = await Promise.all([
    prisma.inventoryLedger.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, direction: true, qty: true, trxDate: true },
    }),
    prisma.purchaseOrderItem.findMany({
      where: {
        sku: { in: skus },
        po: { status: { in: ['OPEN', 'PARTIAL'] } },
        status: { not: 'COMPLETED' },
      },
      select: {
        sku: true,
        qtyOrder: true,
        qtyReceived: true,
        vendorId: true,
      },
    }),
  ])

  // Group ledger by SKU
  const ledgerBySku = new Map<string, typeof ledger>()
  for (const entry of ledger) {
    const list = ledgerBySku.get(entry.sku) ?? []
    list.push(entry)
    ledgerBySku.set(entry.sku, list)
  }

  // Group active POs by SKU
  const poBySku = new Map<string, { qtyOnPO: number; vendors: Set<string>; count: number }>()
  for (const item of poItems) {
    const cur = poBySku.get(item.sku) ?? { qtyOnPO: 0, vendors: new Set<string>(), count: 0 }
    cur.qtyOnPO += Math.max(0, item.qtyOrder - (item.qtyReceived || 0))
    if (item.vendorId) cur.vendors.add(item.vendorId)
    cur.count += 1
    poBySku.set(item.sku, cur)
  }

  // Calculate SOH and PO info per product
  const result = products.map(p => {
    const entries = ledgerBySku.get(p.sku) ?? []
    const soh = calculateSOH(
      p.stokAwal,
      p.lastOpnameDate,
      entries.map(e => ({
        sku: e.sku,
        direction: e.direction as 'IN' | 'OUT',
        qty: e.qty,
        trxDate: e.trxDate,
      }))
    )
    const poInfo = poBySku.get(p.sku)
    const qtyOnPO = poInfo?.qtyOnPO ?? 0
    const poVendorCount = poInfo?.vendors.size ?? 0
    const activePoCount = poInfo?.count ?? 0

    return {
      ...p,
      soh,
      qtyOnPO,
      poVendorCount,
      activePoCount,
      isBelowRop: soh <= p.rop,
      stockStatus: soh <= 0 ? 'EMPTY' : soh <= p.rop ? 'LOW' : 'OK',
    }
  })

  const filtered = belowRop ? result.filter(p => p.isBelowRop) : result
  
  // Natural sort on backend as default
  filtered.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' }))

  return apiSuccess({
    products: filtered,
    total: filtered.length,
    summary: {
      totalProducts: filtered.length,
      emptyStock: filtered.filter(p => p.soh <= 0).length,
      lowStock: filtered.filter(p => p.soh > 0 && p.isBelowRop).length,
      okStock: filtered.filter(p => !p.isBelowRop && p.soh > 0).length,
    },
  })
}
