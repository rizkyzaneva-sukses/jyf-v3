import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { apiSuccess, apiError, parseWibDateInput } from '@/lib/utils'

const allowedRoles = ['OWNER', 'FINANCE']
const openingId = 'opening-balance'

function toAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null
}

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) return apiError('Unauthorized', 401)
  if (!allowedRoles.includes(session.userRole)) return apiError('Forbidden', 403)

  const [opening, inventorySnapshots] = await Promise.all([
    prisma.neracaSaldoAwal.findUnique({ where: { id: openingId } }),
    prisma.neracaPersediaanManual.findMany({ orderBy: { effectiveDate: 'desc' }, take: 24 }),
  ])
  return apiSuccess({ opening, inventorySnapshots })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) return apiError('Unauthorized', 401)
  if (!allowedRoles.includes(session.userRole)) return apiError('Hanya Owner atau Finance yang dapat mengatur saldo awal', 403)

  const body = await request.json()
  const action = body.action || 'opening'

  if (action === 'inventory') {
    const amount = toAmount(body.amount)
    if (!body.effectiveDate || amount === null) return apiError('Tanggal efektif dan nilai persediaan wajib diisi')
    const effectiveDate = parseWibDateInput(body.effectiveDate)
    const snapshot = await prisma.neracaPersediaanManual.upsert({
      where: { effectiveDate },
      create: { effectiveDate, amount, note: body.note?.trim() || null, createdBy: session.username, updatedBy: session.username },
      update: { amount, note: body.note?.trim() || null, updatedBy: session.username },
    })
    return apiSuccess({ message: 'Nilai persediaan Neraca berhasil disimpan', snapshot }, 201)
  }

  const keys = ['kasBank', 'piutangUsaha', 'persediaan', 'asetTetap', 'utangVendor', 'utangPinjaman', 'modalDisetor'] as const
  if (!body.effectiveDate) return apiError('Tanggal saldo awal wajib diisi')
  const values = Object.fromEntries(keys.map((key) => [key, toAmount(body[key])])) as Record<typeof keys[number], number | null>
  if (Object.values(values).some((value) => value === null)) return apiError('Semua nominal harus berupa angka nol atau lebih')

  const effectiveDate = parseWibDateInput(body.effectiveDate)
  const data = {
    effectiveDate,
    kasBank: values.kasBank!,
    piutangUsaha: values.piutangUsaha!,
    persediaan: values.persediaan!,
    asetTetap: values.asetTetap!,
    utangVendor: values.utangVendor!,
    utangPinjaman: values.utangPinjaman!,
    modalDisetor: values.modalDisetor!,
    note: body.note?.trim() || null,
    updatedBy: session.username,
  }

  const opening = await prisma.$transaction(async (tx) => {
    const saved = await tx.neracaSaldoAwal.upsert({
      where: { id: openingId },
      create: { id: openingId, ...data, createdBy: session.username },
      update: data,
    })
    await tx.neracaPersediaanManual.upsert({
      where: { effectiveDate },
      create: { effectiveDate, amount: data.persediaan, note: 'Saldo awal Neraca', createdBy: session.username, updatedBy: session.username },
      update: { amount: data.persediaan, note: 'Saldo awal Neraca', updatedBy: session.username },
    })
    await tx.auditLog.create({
      data: {
        entityType: 'NeracaSaldoAwal', action: 'UPDATE', entityId: openingId,
        afterJson: { ...data, effectiveDate: body.effectiveDate },
        note: 'Simpan saldo awal Neraca', performedBy: session.username,
      },
    })
    return saved
  })

  return apiSuccess({ message: 'Saldo awal Neraca berhasil disimpan', opening }, 201)
}
