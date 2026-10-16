import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { apiSuccess, apiError } from '@/lib/utils'

// GET /api/procurement/product-tracking
// Query: search (productName or SKU), status ('active' | 'all'), vendorId
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) return apiError('Unauthorized', 401)
  if (!['OWNER', 'FINANCE', 'STAFF'].includes(session.userRole)) return apiError('Forbidden', 403)

  const { searchParams } = request.nextUrl
  const search = (searchParams.get('search') || '').trim()
  const status = searchParams.get('status') || 'active'
  const vendorId = searchParams.get('vendorId') || ''

  const poStatusCondition = status === 'active'
    ? { in: ['OPEN' as const, 'PARTIAL' as const] }
    : undefined

  const where: any = {
    ...(poStatusCondition && {
      po: {
        status: poStatusCondition,
        ...(vendorId && { vendorId }),
      },
    }),
    ...(!poStatusCondition && vendorId && {
      po: { vendorId },
    }),
    ...(search && {
      OR: [
        { sku: { contains: search, mode: 'insensitive' as const } },
        { productName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const items = await prisma.purchaseOrderItem.findMany({
    where,
    include: {
      po: {
        select: {
          id: true,
          poNumber: true,
          poDate: true,
          expectedDate: true,
          status: true,
          paymentStatus: true,
          vendorId: true,
          vendorName: true,
          note: true,
          totalQtyOrder: true,
          totalQtyReceived: true,
          totalAmount: true,
          totalPaid: true,
          items: true,
          vendor: {
            select: {
              kontak: true,
              email: true,
              alamat: true,
            },
          },
        },
      },
    },
    orderBy: [
      { po: { poDate: 'desc' } },
      { productName: 'asc' },
    ],
  })

  // Group by SKU
  const productMap = new Map<string, {
    sku: string
    productName: string
    totalQtyOrder: number
    totalQtyReceived: number
    totalOutstanding: number
    vendors: Map<string, {
      vendorId: string
      vendorName: string
      vendorContact: string | null
      totalQtyOrder: number
      totalQtyReceived: number
      totalOutstanding: number
      pos: any[]
    }>
  }>()

  for (const item of items) {
    if (!item.po) continue
    const sku = item.sku
    let p = productMap.get(sku)
    if (!p) {
      p = {
        sku,
        productName: item.productName,
        totalQtyOrder: 0,
        totalQtyReceived: 0,
        totalOutstanding: 0,
        vendors: new Map(),
      }
      productMap.set(sku, p)
    }

    const outstanding = Math.max(0, item.qtyOrder - (item.qtyReceived || 0))
    p.totalQtyOrder += item.qtyOrder
    p.totalQtyReceived += item.qtyReceived || 0
    p.totalOutstanding += outstanding

    const vId = item.vendorId || item.po.vendorId
    const vName = item.vendorName || item.po.vendorName
    let v = p.vendors.get(vId)
    if (!v) {
      v = {
        vendorId: vId,
        vendorName: vName,
        vendorContact: item.po.vendor?.kontak || null,
        totalQtyOrder: 0,
        totalQtyReceived: 0,
        totalOutstanding: 0,
        pos: [],
      }
      p.vendors.set(vId, v)
    }

    v.totalQtyOrder += item.qtyOrder
    v.totalQtyReceived += item.qtyReceived || 0
    v.totalOutstanding += outstanding

    v.pos.push({
      itemId: item.id,
      poId: item.po.id,
      poNumber: item.po.poNumber,
      poDate: item.po.poDate,
      expectedDate: item.po.expectedDate,
      poStatus: item.po.status,
      paymentStatus: item.po.paymentStatus,
      itemStatus: item.status,
      unitPrice: item.unitPrice,
      qtyOrder: item.qtyOrder,
      qtyReceived: item.qtyReceived || 0,
      outstandingQty: outstanding,
      note: item.po.note,
      fullPo: item.po,
    })
  }

  // Convert to array
  const products = Array.from(productMap.values()).map(p => ({
    sku: p.sku,
    productName: p.productName,
    totalQtyOrder: p.totalQtyOrder,
    totalQtyReceived: p.totalQtyReceived,
    totalOutstanding: p.totalOutstanding,
    vendorCount: p.vendors.size,
    vendors: Array.from(p.vendors.values()),
  }))

  // Sort products: highest totalOutstanding first, then alphabetical by SKU
  products.sort((a, b) => b.totalOutstanding - a.totalOutstanding || a.sku.localeCompare(b.sku, undefined, { numeric: true }))

  // Calculate summary
  const allUniqueVendors = new Set<string>()
  let grandTotalOrder = 0
  let grandTotalReceived = 0
  let grandTotalOutstanding = 0

  for (const p of products) {
    grandTotalOrder += p.totalQtyOrder
    grandTotalReceived += p.totalQtyReceived
    grandTotalOutstanding += p.totalOutstanding
    for (const v of p.vendors) {
      allUniqueVendors.add(v.vendorId)
    }
  }

  return apiSuccess({
    products,
    summary: {
      totalProducts: products.length,
      totalVendors: allUniqueVendors.size,
      totalQtyOrder: grandTotalOrder,
      totalQtyReceived: grandTotalReceived,
      totalOutstanding: grandTotalOutstanding,
    },
  })
}
