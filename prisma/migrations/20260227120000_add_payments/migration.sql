-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountKurus" INTEGER NOT NULL,
    "billingDay" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentInstance" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "amountKurus" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'due',
    "paidAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentPlan_customerId_idx" ON "PaymentPlan"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInstance_planId_month_key" ON "PaymentInstance"("planId", "month");

-- CreateIndex
CREATE INDEX "PaymentInstance_customerId_month_idx" ON "PaymentInstance"("customerId", "month");

-- CreateIndex
CREATE INDEX "PaymentInstance_status_dueAt_idx" ON "PaymentInstance"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentInstance" ADD CONSTRAINT "PaymentInstance_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
