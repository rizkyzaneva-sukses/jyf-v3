'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, Save } from 'lucide-react'
import { formatDate, formatRupiah, wibYmd } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'

const defaultForm = {
  effectiveDate: '2026-10-01', kasBank: '', piutangUsaha: '', persediaan: '',
  asetTetap: '', utangVendor: '', utangPinjaman: '', modalDisetor: '', note: '',
}

function amount(value: string) {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

function AmountField({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <div>
    <label className="block text-xs text-zinc-400 mb-1">{label}</label>
    <input type="number" min="0" step="1" value={value} onChange={(event) => onChange(event.target.value)}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600" />
    {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
  </div>
}

export function NeracaSaldoAwalTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [inventory, setInventory] = useState({ effectiveDate: '2026-10-01', amount: '', note: '' })
  const [savingOpening, setSavingOpening] = useState(false)
  const [savingInventory, setSavingInventory] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['neraca-saldo-awal'],
    queryFn: () => fetch('/api/neraca-saldo-awal').then((response) => response.json()).then((json) => json.data),
  })

  useEffect(() => {
    const opening = data?.opening
    if (!opening) return
    setForm({
      effectiveDate: wibYmd(opening.effectiveDate), kasBank: String(opening.kasBank),
      piutangUsaha: String(opening.piutangUsaha), persediaan: String(opening.persediaan),
      asetTetap: String(opening.asetTetap), utangVendor: String(opening.utangVendor),
      utangPinjaman: String(opening.utangPinjaman), modalDisetor: String(opening.modalDisetor),
      note: opening.note || '',
    })
    setInventory((current) => ({ ...current, effectiveDate: wibYmd(opening.effectiveDate) }))
  }, [data?.opening])

  const totals = useMemo(() => {
    const assets = amount(form.kasBank) + amount(form.piutangUsaha) + amount(form.persediaan) + amount(form.asetTetap)
    const liabilities = amount(form.utangVendor) + amount(form.utangPinjaman)
    return { assets, liabilities, adjustment: assets - liabilities - amount(form.modalDisetor) }
  }, [form])
  const setValue = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(body: object, successMessage: string) {
    const response = await fetch('/api/neraca-saldo-awal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'Gagal menyimpan')
    toast({ title: successMessage, type: 'success' })
    queryClient.invalidateQueries({ queryKey: ['neraca-saldo-awal'] })
    queryClient.invalidateQueries({ queryKey: ['reports'] })
  }

  const saveOpening = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingOpening(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, key === 'effectiveDate' || key === 'note' ? value : amount(value)]))
      await submit(payload, 'Saldo awal Neraca berhasil disimpan')
    } catch (error: any) {
      toast({ title: error.message || 'Gagal menyimpan saldo awal', type: 'error' })
    } finally {
      setSavingOpening(false)
    }
  }

  const saveInventory = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingInventory(true)
    try {
      await submit({ action: 'inventory', ...inventory, amount: amount(inventory.amount) }, 'Nilai persediaan Neraca berhasil disimpan')
      setInventory((current) => ({ ...current, amount: '', note: '' }))
    } catch (error: any) {
      toast({ title: error.message || 'Gagal menyimpan nilai persediaan', type: 'error' })
    } finally {
      setSavingInventory(false)
    }
  }

  return <div className="space-y-6">
    <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-sm text-amber-100">
      <p className="font-semibold">Reset pembukuan Neraca per 1 Oktober 2026</p>
      <p className="mt-1 text-amber-200/70">Isi angka kondisi nyata pada awal hari. Ini tidak menghapus order, stok SKU, wallet ledger, atau riwayat transaksi lama.</p>
    </div>

    <form onSubmit={saveOpening} className="grid xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h2 className="font-semibold text-white">Isian Saldo Awal Neraca</h2><p className="text-xs text-zinc-500 mt-1">Persediaan cukup satu total nominal manual; tidak perlu input per baju atau celana.</p></div>
          {data?.opening && <span className="text-[11px] text-emerald-400 border border-emerald-900 rounded-full px-2 py-1">Sudah aktif</span>}
        </div>
        <div className="mb-5 max-w-xs">
          <label className="block text-xs text-zinc-400 mb-1">Tanggal efektif saldo awal *</label>
          <input required type="date" value={form.effectiveDate} onChange={(event) => setValue('effectiveDate', event.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600 [&::-webkit-calendar-picker-indicator]:invert-[0.6]" />
        </div>
        <div className="grid md:grid-cols-2 gap-x-5 gap-y-4">
          <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
            <h3 className="text-sm font-medium text-emerald-400">Aset</h3>
            <AmountField label="Kas & Bank" value={form.kasBank} onChange={(value) => setValue('kasBank', value)} />
            <AmountField label="Piutang Usaha" value={form.piutangUsaha} onChange={(value) => setValue('piutangUsaha', value)} />
            <AmountField label="Nilai Persediaan" value={form.persediaan} onChange={(value) => setValue('persediaan', value)} hint="Total nominal manual hasil hitung tim." />
            <AmountField label="Nilai Buku Aset Tetap" value={form.asetTetap} onChange={(value) => setValue('asetTetap', value)} />
          </div>
          <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
            <h3 className="text-sm font-medium text-blue-400">Liabilitas & Modal</h3>
            <AmountField label="Utang Vendor" value={form.utangVendor} onChange={(value) => setValue('utangVendor', value)} />
            <AmountField label="Utang Pinjaman" value={form.utangPinjaman} onChange={(value) => setValue('utangPinjaman', value)} />
            <AmountField label="Modal Disetor" value={form.modalDisetor} onChange={(value) => setValue('modalDisetor', value)} />
            <div className="pt-1 border-t border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-500"><span>Penyesuaian Ekuitas Awal</span><span className={totals.adjustment >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatRupiah(totals.adjustment, true)}</span></div>
              <p className="mt-1 text-zinc-600">Menutup selisih pembukuan lama, bukan laba ditahan baru.</p>
            </div>
          </div>
        </div>
        <div className="mt-4"><label className="block text-xs text-zinc-400 mb-1">Catatan reset</label><textarea value={form.note} onChange={(event) => setValue('note', event.target.value)} rows={2} placeholder="Contoh: Saldo hasil rekonsiliasi tim per awal Oktober." className="w-full resize-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-600" /></div>
        <button type="submit" disabled={savingOpening || isLoading} className="mt-5 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium"><Save size={16} />{savingOpening ? 'Menyimpan...' : 'Simpan Saldo Awal Neraca'}</button>
      </section>
      <aside className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-fit">
        <h2 className="font-semibold text-white">Ringkasan Reset</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Total aset awal</span><span className="text-emerald-400">{formatRupiah(totals.assets, true)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Total liabilitas awal</span><span className="text-red-300">{formatRupiah(totals.liabilities, true)}</span></div>
          <div className="flex justify-between border-t border-zinc-800 pt-3 font-medium"><span className="text-zinc-300">Ekuitas awal</span><span className="text-white">{formatRupiah(totals.assets - totals.liabilities, true)}</span></div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-zinc-500">Setelah disimpan, Neraca memakai saldo ini sebagai titik awal. Pergerakan kas, piutang, utang, modal, dan prive setelah tanggal reset dihitung dari sini.</p>
      </aside>
    </form>

    <div className="grid xl:grid-cols-3 gap-6">
      <form onSubmit={saveInventory} className="xl:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2"><PackagePlus size={17} className="text-emerald-400" /><h2 className="font-semibold text-white">Update Nilai Persediaan</h2></div>
        <p className="text-xs text-zinc-500 mt-1">Isi ulang setiap tanggal 1 untuk mengganti nilai persediaan pada Neraca.</p>
        <div className="mt-4 space-y-3">
          <div><label className="block text-xs text-zinc-400 mb-1">Tanggal efektif *</label><input required type="date" value={inventory.effectiveDate} onChange={(event) => setInventory((current) => ({ ...current, effectiveDate: event.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 [&::-webkit-calendar-picker-indicator]:invert-[0.6]" /></div>
          <AmountField label="Total nilai persediaan" value={inventory.amount} onChange={(value) => setInventory((current) => ({ ...current, amount: value }))} />
          <div><label className="block text-xs text-zinc-400 mb-1">Catatan</label><input value={inventory.note} onChange={(event) => setInventory((current) => ({ ...current, note: event.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" /></div>
        </div>
        <button type="submit" disabled={savingInventory} className="mt-4 inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-medium"><Save size={16} />{savingInventory ? 'Menyimpan...' : 'Simpan Nilai Persediaan'}</button>
      </form>
      <section className="xl:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-zinc-800"><h2 className="font-semibold text-white">Riwayat Nilai Persediaan Neraca</h2></div>
        <table className="data-table"><thead><tr><th>Tanggal efektif</th><th className="text-right">Nilai persediaan</th><th>Catatan</th></tr></thead><tbody>
          {isLoading ? <tr><td colSpan={3} className="py-6 text-center text-zinc-500">Memuat...</td></tr>
            : !data?.inventorySnapshots?.length ? <tr><td colSpan={3} className="py-6 text-center text-zinc-500">Belum ada nilai persediaan.</td></tr>
              : data.inventorySnapshots.map((row: any) => <tr key={row.id}><td className="text-zinc-300">{formatDate(row.effectiveDate)}</td><td className="text-right text-emerald-400 font-medium">{formatRupiah(row.amount, true)}</td><td className="text-zinc-500">{row.note || '-'}</td></tr>)}
        </tbody></table>
      </section>
    </div>
  </div>
}
