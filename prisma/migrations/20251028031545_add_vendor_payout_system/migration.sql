-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('AHORROS', 'CORRIENTE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'CE', 'NIT', 'PP');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderDocument" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'CC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispersionConfig" (
    "id" SERIAL NOT NULL,
    "dispersalFrequency" INTEGER NOT NULL DEFAULT 7,
    "adminCommission" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "minimumPayout" DECIMAL(12,2) NOT NULL DEFAULT 50000,
    "isAutoDispersalOn" BOOLEAN NOT NULL DEFAULT true,
    "lastDispersalDate" TIMESTAMP(3),
    "nextDispersalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispersionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayout" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "adminCommission" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIds" TEXT,
    "bankAccount" TEXT,
    "epaycoReference" TEXT,
    "epaycoResponse" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_userId_isActive_idx" ON "BankAccount"("userId", "isActive");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE INDEX "VendorPayout_vendorId_status_idx" ON "VendorPayout"("vendorId", "status");

-- CreateIndex
CREATE INDEX "VendorPayout_vendorId_createdAt_idx" ON "VendorPayout"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "VendorPayout_status_idx" ON "VendorPayout"("status");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
