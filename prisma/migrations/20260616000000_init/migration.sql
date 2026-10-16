-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'FINANCE', 'STAFF', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('SALES', 'RETURN_PURCHASE', 'PRIVE', 'MARKETING', 'PURCHASE', 'RETURN_SALES', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ScanBatchStatus" AS ENUM ('DRAFT', 'COMMITTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ScanBatchReason" AS ENUM ('SALES', 'RETURN_PURCHASE', 'PRIVE', 'MARKETING', 'PURCHASE', 'RETURN_SALES');

-- CreateEnum
CREATE TYPE "OpnameBatchStatus" AS ENUM ('DRAFT', 'COMMITTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('OPEN', 'PARTIAL', 'COMPLETED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "POPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "POItemStatus" AS ENUM ('OPEN', 'PARTIAL', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WalletTrxType" AS ENUM ('PAYOUT', 'OTHER_INCOME', 'EXPENSE', 'TRANSFER', 'MODAL_MASUK', 'PRIVE', 'INVESTASI', 'VENDOR_PAYMENT', 'PENGEMBALIAN_MODAL', 'BAYAR_UTANG', 'TERIMA_PIUTANG_ND');

-- CreateEnum
CREATE TYPE "MasterCategoryType" AS ENUM ('OTHER_INCOME', 'EXPENSE_BEBAN', 'EXPENSE_NON_BEBAN');

-- CreateEnum
CREATE TYPE "VendorPaymentType" AS ENUM ('DP', 'PELUNASAN', 'PARTIAL');

-- CreateEnum
CREATE TYPE "VendorPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UtangType" AS ENUM ('SUNTIKAN_MODAL', 'PINJAMAN_BANK', 'PINJAMAN_PRIBADI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "UtangStatus" AS ENUM ('OUTSTANDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PiutangType" AS ENUM ('PINJAMAN_KARYAWAN', 'PO_VENDOR_BELUM_DIKIRIM', 'LAINNYA');

-- CreateEnum
CREATE TYPE "PiutangStatus" AS ENUM ('OUTSTANDING', 'PARTIAL', 'COLLECTED');

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM ('PurchaseOrder', 'VendorPayment', 'Other');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SCAN', 'COMMIT', 'CANCEL');

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "full_name" TEXT,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_products" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "category_id" TEXT,
    "category_name" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "hpp" INTEGER NOT NULL DEFAULT 0,
    "rop" INTEGER NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER NOT NULL DEFAULT 0,
    "stok_awal" INTEGER NOT NULL DEFAULT 0,
    "last_opname_date" TIMESTAMP(3),
    "variant_info" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "master_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ledger" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "sku" TEXT NOT NULL,
    "trx_date" TIMESTAMP(3) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "reason" "LedgerReason" NOT NULL,
    "qty" INTEGER NOT NULL,
    "batch_id" TEXT,
    "ref_opname_id" TEXT,
    "note" TEXT,

    CONSTRAINT "inventory_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_scan_batches" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "batch_date" TIMESTAMP(3) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "reason" "ScanBatchReason",
    "status" "ScanBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "items_json" JSONB,
    "scanned_by" TEXT,
    "vendor_id" TEXT,
    "vendor_name" TEXT,

    CONSTRAINT "inventory_scan_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_batches" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "opname_date" TIMESTAMP(3) NOT NULL,
    "warehouse_name" TEXT,
    "status" "OpnameBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "total_sku" INTEGER NOT NULL DEFAULT 0,
    "total_adjustment_qty" INTEGER NOT NULL DEFAULT 0,
    "committed_at" TIMESTAMP(3),
    "committed_by" TEXT,

    CONSTRAINT "stock_opname_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "opname_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "system_qty" INTEGER NOT NULL,
    "actual_qty" INTEGER NOT NULL,
    "diff_qty" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "stock_opname_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "order_no" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "platform" TEXT,
    "airwaybill" TEXT,
    "order_created_at" TEXT,
    "trx_date" TIMESTAMP(3),
    "sku" TEXT,
    "product_name" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "total_product_price" INTEGER NOT NULL DEFAULT 0,
    "real_omzet" INTEGER NOT NULL DEFAULT 0,
    "city" TEXT,
    "province" TEXT,
    "buyer_username" TEXT,
    "receiver_name" TEXT,
    "phone" TEXT,
    "hpp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_scan_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL,
    "scanned_by" TEXT,
    "note" TEXT,

    CONSTRAINT "order_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_ads_budget" BOOLEAN NOT NULL DEFAULT false,
    "linked_platform" TEXT,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "order_no" TEXT NOT NULL,
    "released_date" TIMESTAMP(3) NOT NULL,
    "platform" TEXT,
    "omzet" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "ams_fee" INTEGER NOT NULL,
    "platform_fee_other" INTEGER NOT NULL DEFAULT 0,
    "beban_ongkir" INTEGER NOT NULL DEFAULT 0,
    "total_income" INTEGER NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "source" TEXT,
    "order_id" TEXT,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "wallet_id" TEXT NOT NULL,
    "trx_date" TIMESTAMP(3) NOT NULL,
    "trx_type" "WalletTrxType" NOT NULL,
    "category" TEXT,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "ref_order_no" TEXT,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_type" "MasterCategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_reasons" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reason_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "master_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "vendor_code" TEXT NOT NULL,
    "nama_vendor" TEXT NOT NULL,
    "kontak" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "rekening" TEXT,
    "bank" TEXT,
    "term_payment" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "po_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "po_date" TIMESTAMP(3) NOT NULL,
    "expected_date" TIMESTAMP(3),
    "status" "POStatus" NOT NULL DEFAULT 'OPEN',
    "payment_status" "POPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "total_qty_order" INTEGER NOT NULL DEFAULT 0,
    "total_qty_received" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "total_paid" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "po_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "qty_order" INTEGER NOT NULL,
    "qty_received" INTEGER NOT NULL DEFAULT 0,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "status" "POItemStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "receipt_number" TEXT NOT NULL,
    "po_id" TEXT,
    "po_number" TEXT,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL,
    "surat_jalan_number" TEXT,
    "items_json" JSONB,
    "note" TEXT,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receipt_id" TEXT NOT NULL,
    "po_id" TEXT,
    "po_item_id" TEXT,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "qty_received" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "payment_number" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "po_id" TEXT,
    "po_number" TEXT,
    "wallet_id" TEXT NOT NULL,
    "wallet_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_type" "VendorPaymentType" NOT NULL,
    "status" "VendorPaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "note" TEXT,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utangs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "type" "UtangType" NOT NULL,
    "creditor_name" TEXT NOT NULL,
    "source_wallet_id" TEXT NOT NULL,
    "source_wallet_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL DEFAULT 0,
    "trx_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "UtangStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "proof_image_url" TEXT,
    "note" TEXT,

    CONSTRAINT "utangs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utang_payments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "utang_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "wallet_name" TEXT NOT NULL,
    "proof_image_url" TEXT,
    "note" TEXT,

    CONSTRAINT "utang_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piutangs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "type" "PiutangType" NOT NULL,
    "debtor_name" TEXT NOT NULL,
    "source_wallet_id" TEXT NOT NULL,
    "source_wallet_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amount_collected" INTEGER NOT NULL DEFAULT 0,
    "trx_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "PiutangStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "related_entity_id" TEXT,
    "related_entity_type" "RelatedEntityType",
    "proof_image_url" TEXT,
    "note" TEXT,

    CONSTRAINT "piutangs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piutang_collections" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "piutang_id" TEXT NOT NULL,
    "collection_date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "wallet_name" TEXT NOT NULL,
    "proof_image_url" TEXT,
    "note" TEXT,

    CONSTRAINT "piutang_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_id" TEXT,
    "ref_order_no" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "note" TEXT,
    "performed_by" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_expense_categories" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "is_beban" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "master_expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aset_tetap" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "nama_aset" TEXT NOT NULL,
    "nilai_perolehan" INTEGER NOT NULL,
    "tanggal_beli" TIMESTAMP(3) NOT NULL,
    "umur_ekonomis_thn" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "wallet_id" TEXT,
    "note" TEXT,

    CONSTRAINT "aset_tetap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modal_awal" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal_setup" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "modal_awal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggest_revisions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "images_base64" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT,

    CONSTRAINT "suggest_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_mappings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "from_sku" TEXT NOT NULL,
    "to_sku" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sku_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "telegram_recipients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "report_types" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "cron_schedule" TEXT NOT NULL DEFAULT '30 17 * * *',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT,
    "period" TEXT NOT NULL,
    "period_type" TEXT NOT NULL DEFAULT 'monthly',
    "content" TEXT NOT NULL,
    "model_used" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "data_snapshot" JSONB,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_edit_requests" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledger_id" TEXT NOT NULL,
    "wallet_name" TEXT,
    "requested_by" TEXT NOT NULL,
    "current_snapshot" JSONB NOT NULL,
    "changes" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reject_note" TEXT,

    CONSTRAINT "ledger_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "master_products_sku_key" ON "master_products"("sku");

-- CreateIndex
CREATE INDEX "inventory_ledger_sku_idx" ON "inventory_ledger"("sku");

-- CreateIndex
CREATE INDEX "inventory_ledger_trx_date_idx" ON "inventory_ledger"("trx_date");

-- CreateIndex
CREATE INDEX "inventory_ledger_batch_id_idx" ON "inventory_ledger"("batch_id");

-- CreateIndex
CREATE INDEX "inventory_scan_batches_vendor_id_idx" ON "inventory_scan_batches"("vendor_id");

-- CreateIndex
CREATE INDEX "stock_opname_items_opname_id_idx" ON "stock_opname_items"("opname_id");

-- CreateIndex
CREATE INDEX "orders_order_no_idx" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_airwaybill_idx" ON "orders"("airwaybill");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_platform_idx" ON "orders"("platform");

-- CreateIndex
CREATE INDEX "orders_order_created_at_idx" ON "orders"("order_created_at");

-- CreateIndex
CREATE INDEX "orders_trx_date_idx" ON "orders"("trx_date");

-- CreateIndex
CREATE INDEX "orders_platform_status_idx" ON "orders"("platform", "status");

-- CreateIndex
CREATE INDEX "orders_status_order_created_at_idx" ON "orders"("status", "order_created_at");

-- CreateIndex
CREATE INDEX "orders_platform_order_created_at_idx" ON "orders"("platform", "order_created_at");

-- CreateIndex
CREATE INDEX "orders_trx_date_platform_idx" ON "orders"("trx_date", "platform");

-- CreateIndex
CREATE INDEX "order_scan_logs_order_no_idx" ON "order_scan_logs"("order_no");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_name_key" ON "wallets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_order_no_key" ON "payouts"("order_no");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_order_id_key" ON "payouts"("order_id");

-- CreateIndex
CREATE INDEX "payouts_order_no_idx" ON "payouts"("order_no");

-- CreateIndex
CREATE INDEX "payouts_wallet_id_idx" ON "payouts"("wallet_id");

-- CreateIndex
CREATE INDEX "payouts_platform_idx" ON "payouts"("platform");

-- CreateIndex
CREATE INDEX "payouts_released_date_idx" ON "payouts"("released_date");

-- CreateIndex
CREATE INDEX "wallet_ledger_wallet_id_idx" ON "wallet_ledger"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_ledger_trx_date_idx" ON "wallet_ledger"("trx_date");

-- CreateIndex
CREATE INDEX "wallet_ledger_trx_type_idx" ON "wallet_ledger"("trx_type");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendor_code_key" ON "vendors"("vendor_code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_order_items_po_id_idx" ON "purchase_order_items"("po_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_sku_idx" ON "purchase_order_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_receipt_number_key" ON "goods_receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "goods_receipts_po_id_idx" ON "goods_receipts"("po_id");

-- CreateIndex
CREATE INDEX "goods_receipts_receipt_number_idx" ON "goods_receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "goods_receipt_items_receipt_id_idx" ON "goods_receipt_items"("receipt_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_po_id_idx" ON "goods_receipt_items"("po_id");

-- CreateIndex
CREATE INDEX "vendor_payments_vendor_id_idx" ON "vendor_payments"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_payments_po_id_idx" ON "vendor_payments"("po_id");

-- CreateIndex
CREATE INDEX "utang_payments_utang_id_idx" ON "utang_payments"("utang_id");

-- CreateIndex
CREATE INDEX "piutang_collections_piutang_id_idx" ON "piutang_collections"("piutang_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "master_expense_categories_name_key" ON "master_expense_categories"("name");

-- CreateIndex
CREATE INDEX "master_expense_categories_group_idx" ON "master_expense_categories"("group");

-- CreateIndex
CREATE INDEX "aset_tetap_is_active_idx" ON "aset_tetap"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "modal_awal_wallet_id_key" ON "modal_awal"("wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "sku_mappings_from_sku_key" ON "sku_mappings"("from_sku");

-- CreateIndex
CREATE UNIQUE INDEX "neraca_saldo_awal_effective_date_key" ON "neraca_saldo_awal"("effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "neraca_persediaan_manual_effective_date_key" ON "neraca_persediaan_manual"("effective_date");

-- CreateIndex
CREATE INDEX "neraca_persediaan_manual_effective_date_idx" ON "neraca_persediaan_manual"("effective_date");

-- CreateIndex
CREATE INDEX "ai_insights_period_type_created_at_idx" ON "ai_insights"("period_type", "created_at");

-- CreateIndex
CREATE INDEX "ledger_edit_requests_status_idx" ON "ledger_edit_requests"("status");

-- CreateIndex
CREATE INDEX "ledger_edit_requests_requested_by_idx" ON "ledger_edit_requests"("requested_by");

-- AddForeignKey
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_sku_fkey" FOREIGN KEY ("sku") REFERENCES "master_products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_scan_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_ref_opname_id_fkey" FOREIGN KEY ("ref_opname_id") REFERENCES "stock_opname_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_opname_id_fkey" FOREIGN KEY ("opname_id") REFERENCES "stock_opname_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_sku_fkey" FOREIGN KEY ("sku") REFERENCES "master_products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_scan_logs" ADD CONSTRAINT "order_scan_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_sku_fkey" FOREIGN KEY ("sku") REFERENCES "master_products"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utangs" ADD CONSTRAINT "utangs_source_wallet_id_fkey" FOREIGN KEY ("source_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utang_payments" ADD CONSTRAINT "utang_payments_utang_id_fkey" FOREIGN KEY ("utang_id") REFERENCES "utangs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utang_payments" ADD CONSTRAINT "utang_payments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutangs" ADD CONSTRAINT "piutangs_source_wallet_id_fkey" FOREIGN KEY ("source_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutangs" ADD CONSTRAINT "piutangs_related_entity_id_fkey" FOREIGN KEY ("related_entity_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutang_collections" ADD CONSTRAINT "piutang_collections_piutang_id_fkey" FOREIGN KEY ("piutang_id") REFERENCES "piutangs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piutang_collections" ADD CONSTRAINT "piutang_collections_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aset_tetap" ADD CONSTRAINT "aset_tetap_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modal_awal" ADD CONSTRAINT "modal_awal_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

