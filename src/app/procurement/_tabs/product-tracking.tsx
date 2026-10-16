'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Package,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Clock,
  RefreshCw,
  Phone,
  FileDown
} from 'lucide-react'
import { formatRupiah, formatDate, downloadCSV } from '@/lib/utils'
import { DetailPOModal, PrintPOModal } from './purchase-orders'

const PO_STATUS_COLOR: Record<string, string> = {
  OPEN: 'badge-warning',
  PARTIAL: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  CLOSED: 'badge-muted',
}

export function ProductTrackingTab({ initialSku }: { initialSku?: string }) {
  const [search, setSearch] = useState(initialSku || '')
  const [status, setStatus] = useState<'active' | 'all'>('active')
  const [vendorFilter, setVendorFilter] = useState('')
  const [expandedSkus, setExpandedSkus] = useState<Record<string, boolean>>({})
  const [detailPO, setDetailPO] = useState<any>(null)
  const [printPO, setPrintPO] = useState<any>(null)

  const { data: vendorData } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => fetch('/api/vendors?all=true').then(r => r.json()).then(d => d.data ?? []),
  })
  const vendors = vendorData ?? []

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['procurement-product-tracking', search, status, vendorFilter],
    queryFn: async () => {
      const p = new URLSearchParams()
      if (search.trim()) p.set('search', search.trim())
      p.set('status', status)
      if (vendorFilter) p.set('vendorId', vendorFilter)
      const res = await fetch(`/api/procurement/product-tracking?${p}`)
      const json = await res.json()
      return json.data
    },
  })

  const products: any[] = data?.products ?? []
  const summary = data?.summary ?? {
    totalProducts: 0,
    totalVendors: 0,
    totalQtyOrder: 0,
    totalQtyReceived: 0,
    totalOutstanding: 0,
  }

  const toggleExpand = (sku: string) => {
    setExpandedSkus(prev => ({
      ...prev,
      [sku]: prev[sku] === undefined ? false : !prev[sku], // default is expanded if not set
    }))
  }

  const isExpanded = (sku: string) => {
    return expandedSkus[sku] ?? true // default expanded
  }

  const handleDownloadPO = (po: any) => {
    downloadCSV(`PO-${po.poNumber}.csv`, (po.items || []).map((item: any) => ({
      'Kode PO': po.poNumber,
      SKU: item.sku,
      'Nama Artikel': item.productName,
      'Qty Order': item.qtyOrder,
      'Qty Receive': item.qtyReceived || 0,
      HPP: item.unitPrice,
      Subtotal: item.qtyOrder * item.unitPrice,
    })))
  }

  const handleExportTracking = () => {
    const rows: any[] = []
    for (const p of products) {
      for (const v of p.vendors) {
        for (const po of v.pos) {
          rows.push({
            SKU: p.sku,
            'Nama Produk': p.productName,
            Vendor: v.vendorName,
            'Kontak Vendor': v.vendorContact || '',
            'No. PO': po.poNumber,
            'Tgl PO': formatDate(po.poDate),
            'Est. Tiba': po.expectedDate ? formatDate(po.expectedDate) : '-',
            'Status PO': po.poStatus,
            'Status Item': po.itemStatus,
            'Qty Order': po.qtyOrder,
            'Qty Diterima': po.qtyReceived,
            'Sisa Belum Tiba': po.outstandingQty,
            'HPP Satuan': po.unitPrice,
            'Catatan PO': po.note || '',
          })
        }
      }
    }
    downloadCSV('tracking-produk-po.csv', rows)
  }

  return (
    <>
      {detailPO && (
        <DetailPOModal
          po={detailPO}
          onClose={() => setDetailPO(null)}
          onDownload={handleDownloadPO}
          onPrint={po => {
            setDetailPO(null)
            setPrintPO(po)
          }}
        />
      )}
      {printPO && <PrintPOModal po={printPO} onClose={() => setPrintPO(null)} />}

      <div className="space-y-6">
        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Total Produk di PO</p>
                <p className="text-2xl font-bold text-white">{summary.totalProducts.toLocaleString('id')}</p>
                <p className="text-zinc-600 text-[11px] mt-0.5">Artikel unik</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Package size={16} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Sisa Belum Tiba</p>
                <p className="text-2xl font-bold text-amber-400">{summary.totalOutstanding.toLocaleString('id')} <span className="text-xs font-normal text-zinc-500">pcs</span></p>
                <p className="text-zinc-600 text-[11px] mt-0.5">Menunggu kiriman vendor</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Total Dipesan</p>
                <p className="text-2xl font-bold text-zinc-200">{summary.totalQtyOrder.toLocaleString('id')} <span className="text-xs font-normal text-zinc-500">pcs</span></p>
                <p className="text-emerald-400/80 text-[11px] mt-0.5">Diterima: {summary.totalQtyReceived.toLocaleString('id')} pcs</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Layers size={16} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Vendor Terlibat</p>
                <p className="text-2xl font-bold text-purple-300">{summary.totalVendors} <span className="text-xs font-normal text-zinc-500">vendor</span></p>
                <p className="text-zinc-600 text-[11px] mt-0.5">Mitra konveksi / produsen</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari artikel / SKU (mis. Arslan White M)..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Vendor</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>{v.namaVendor}</option>
              ))}
            </select>

            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  status === 'active' ? 'bg-emerald-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                PO Aktif (OPEN/PARTIAL)
              </button>
              <button
                type="button"
                onClick={() => setStatus('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  status === 'all' ? 'bg-emerald-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua Riwayat PO
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={14} />
            </button>
            {products.length > 0 && (
              <button
                onClick={handleExportTracking}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm border border-zinc-700 transition-colors"
              >
                <FileDown size={14} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* ── Product List ── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-zinc-600 opacity-50" />
            <h3 className="text-base font-semibold text-zinc-300">Tidak ada produk yang cocok</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
              {search
                ? `Tidak ditemukan PO dengan artikel "${search}". Coba cari kata kunci lain.`
                : 'Saat ini belum ada produk yang tercatat di Purchase Order dengan status ini.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(product => {
              const expanded = isExpanded(product.sku)
              const isMultiVendor = product.vendorCount > 1
              const progressPct = product.totalQtyOrder > 0
                ? Math.round((product.totalQtyReceived / product.totalQtyOrder) * 100)
                : 0

              return (
                <div
                  key={product.sku}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  {/* Product Header Bar */}
                  <div
                    onClick={() => toggleExpand(product.sku)}
                    className="p-4 sm:px-5 cursor-pointer hover:bg-zinc-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/60"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Package size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
                            {product.sku}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {product.productName}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Progress: <strong className="text-zinc-200">{progressPct}%</strong> ({product.totalQtyReceived}/{product.totalQtyOrder} pcs)</span>
                          <span className="text-zinc-600">·</span>
                          {isMultiVendor ? (
                            <span className="text-purple-300 bg-purple-900/30 border border-purple-700/40 px-1.5 py-0.5 rounded text-[11px] font-medium">
                              {product.vendorCount} Vendor Berbeda
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">
                              1 Vendor
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold">
                          <span>Sisa Belum Tiba:</span>
                          <span className="text-sm font-black">{product.totalOutstanding.toLocaleString('id')}</span>
                          <span className="font-normal text-amber-400/80 text-[10px]">pcs</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label="Toggle detail"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                      >
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Vendors & POs */}
                  {expanded && (
                    <div className="p-4 sm:p-5 space-y-4 bg-zinc-950/40">
                      {product.vendors.map((vendor: any) => (
                        <div
                          key={vendor.vendorId}
                          className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl overflow-hidden"
                        >
                          {/* Vendor Sub-header */}
                          <div className="px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Building2 size={15} className="text-zinc-400 shrink-0" />
                              <span className="text-xs font-bold text-zinc-200">
                                {vendor.vendorName}
                              </span>
                              {vendor.vendorContact && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-normal">
                                  <Phone size={11} className="text-zinc-500" />
                                  {vendor.vendorContact}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-zinc-400 text-[11px]">
                                Order: <strong className="text-zinc-300">{vendor.totalQtyOrder}</strong> ·
                                Diterima: <strong className="text-emerald-400">{vendor.totalQtyReceived}</strong>
                              </span>
                              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-500/30">
                                Sisa: {vendor.totalOutstanding} pcs
                              </span>
                            </div>
                          </div>

                          {/* Table of POs for this product at this vendor */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 text-[11px]">
                                  <th className="text-left px-4 py-2 font-medium">No. PO</th>
                                  <th className="text-left px-3 py-2 font-medium">Tgl PO</th>
                                  <th className="text-left px-3 py-2 font-medium">Est. Tiba</th>
                                  <th className="text-center px-3 py-2 font-medium">Status PO</th>
                                  <th className="text-right px-3 py-2 font-medium">Order</th>
                                  <th className="text-right px-3 py-2 font-medium">Diterima</th>
                                  <th className="text-right px-3 py-2 font-medium font-bold text-amber-300">Sisa</th>
                                  <th className="text-right px-3 py-2 font-medium">HPP</th>
                                  <th className="text-center px-3 py-2 font-medium">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60">
                                {vendor.pos.map((po: any) => {
                                  const isOverdue =
                                    po.expectedDate &&
                                    new Date(po.expectedDate) < new Date() &&
                                    po.outstandingQty > 0
                                  return (
                                    <tr key={po.itemId} className="hover:bg-zinc-800/40 transition-colors">
                                      <td className="px-4 py-2.5 font-mono text-emerald-400 font-medium">
                                        {po.poNumber}
                                      </td>
                                      <td className="px-3 py-2.5 text-zinc-400">
                                        {formatDate(po.poDate)}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {po.expectedDate ? (
                                          <span className={isOverdue ? 'text-red-400 font-medium flex items-center gap-1' : 'text-zinc-300'}>
                                            {isOverdue && <AlertCircle size={12} className="shrink-0" />}
                                            {formatDate(po.expectedDate)}
                                          </span>
                                        ) : (
                                          <span className="text-zinc-600">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={`${PO_STATUS_COLOR[po.poStatus] || 'badge-muted'} text-[10px]`}>
                                          {po.poStatus}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-medium text-zinc-200">
                                        {po.qtyOrder}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-emerald-400 font-medium">
                                        {po.qtyReceived}
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-bold text-amber-300">
                                        {po.outstandingQty}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-zinc-400">
                                        {formatRupiah(po.unitPrice, true)}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            onClick={() => setDetailPO(po.fullPo)}
                                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                            title="Lihat Dokumen PO"
                                          >
                                            <Eye size={12} />
                                          </button>
                                          <button
                                            onClick={() => setPrintPO(po.fullPo)}
                                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors"
                                            title="Cetak PO"
                                          >
                                            <Printer size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
