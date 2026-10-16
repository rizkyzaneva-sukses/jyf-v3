CREATE TABLE "neraca_saldo_awal" (
  "id" TEXT NOT NULL DEFAULT 'opening-balance',
  "effective_date" TIMESTAMP(3) NOT NULL,
  "kas_bank" INTEGER NOT NULL DEFAULT 0,
  "piutang_usaha" INTEGER NOT NULL DEFAULT 0,
  "persediaan" INTEGER NOT NULL DEFAULT 0,
  "aset_tetap" INTEGER NOT NULL DEFAULT 0,
  "utang_vendor" INTEGER NOT NULL DEFAULT 0,
  "utang_pinjaman" INTEGER NOT NULL DEFAULT 0,
  "modal_disetor" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "neraca_saldo_awal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "neraca_saldo_awal_effective_date_key"
  ON "neraca_saldo_awal"("effective_date");

CREATE TABLE "neraca_persediaan_manual" (
  "id" TEXT NOT NULL,
  "effective_date" TIMESTAMP(3) NOT NULL,
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "updated_by" TEXT,
  CONSTRAINT "neraca_persediaan_manual_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "neraca_persediaan_manual_effective_date_key"
  ON "neraca_persediaan_manual"("effective_date");
CREATE INDEX "neraca_persediaan_manual_effective_date_idx"
  ON "neraca_persediaan_manual"("effective_date");
