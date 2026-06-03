-- AlterTable
ALTER TABLE "Biodata" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "Savings" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "Shares" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cooperativeId" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cooperativeId" UUID;

-- CreateTable
CREATE TABLE "Cooperative" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "themeConfig" JSONB,
    "systemSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_subdomain_key" ON "Cooperative"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_customDomain_key" ON "Cooperative"("customDomain");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biodata" ADD CONSTRAINT "Biodata_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shares" ADD CONSTRAINT "Shares_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
