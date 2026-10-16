-- Bayar Utang - Bank BCA Rp 45.000.000 (30 Sep 2026) bukan pengeluaran kas.
-- Utang itu ingin dihapus, tapi hapus diblokir kalau sudah ada pembayaran,
-- jadi dicatat lunas. Batalkan utang beserta jurnal masuk dan jurnal bayarnya.
-- Pelunasan utang lain yang masih EXPENSE dipindah ke BAYAR_UTANG:
-- kas tetap berkurang, tapi tidak masuk Operating Expense.

CREATE TEMP TABLE _void_bca_utang ON COMMIT DROP AS
SELECT DISTINCT u.id
FROM utangs u
JOIN utang_payments p ON p.utang_id = u.id
WHERE btrim(u.creditor_name) ILIKE 'Bank BCA'
  AND u.amount = 45000000
  AND p.amount = 45000000
  AND ((p.payment_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::date = DATE '2026-09-30';

DELETE FROM wallet_ledger l
USING utang_payments p, utangs u, _void_bca_utang t
WHERE p.utang_id = t.id
  AND u.id = t.id
  AND l.wallet_id = p.wallet_id
  AND l.amount = -p.amount
  AND l.trx_type IN ('EXPENSE', 'BAYAR_UTANG')
  AND l.category = 'Bayar Utang - ' || u.creditor_name
  AND l.trx_date = p.payment_date;

-- Baris yang terlihat di Kas Utama, kalau tanggalnya tidak identik dengan payment_date.
DELETE FROM wallet_ledger
WHERE category = 'Bayar Utang - Bank BCA'
  AND amount = -45000000
  AND trx_type IN ('EXPENSE', 'BAYAR_UTANG')
  AND ((trx_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::date = DATE '2026-09-30';

DELETE FROM wallet_ledger l
USING utangs u, _void_bca_utang t
WHERE u.id = t.id
  AND l.wallet_id = u.source_wallet_id
  AND l.trx_type = 'OTHER_INCOME'
  AND l.category = 'Utang - ' || u.creditor_name
  AND l.amount = u.amount
  AND l.trx_date = u.trx_date;

DELETE FROM utang_payments p
USING _void_bca_utang t
WHERE p.utang_id = t.id;

DELETE FROM utangs u
USING _void_bca_utang t
WHERE u.id = t.id;

UPDATE wallet_ledger
SET trx_type = 'BAYAR_UTANG'
WHERE trx_type = 'EXPENSE'
  AND category ILIKE 'Bayar Utang -%';
