-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "source_chain" INTEGER NOT NULL,
    "payer_address" TEXT NOT NULL,
    "merchant_address" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "edge_tx_hash" TEXT NOT NULL,
    "lz_message_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),
    "settlement_tx_hash" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_edge_tx_hash_key" ON "payments"("edge_tx_hash");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_edge_tx_hash_idx" ON "payments"("edge_tx_hash");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");
