-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "containerId" INTEGER,
ADD COLUMN     "epaycoResponse" TEXT;

-- CreateTable
CREATE TABLE "EpaycoConfig" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpaycoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EpaycoConfig_userId_key" ON "EpaycoConfig"("userId");

-- CreateIndex
CREATE INDEX "EpaycoConfig_userId_idx" ON "EpaycoConfig"("userId");

-- CreateIndex
CREATE INDEX "payment_containerId_idx" ON "payment"("containerId");

-- AddForeignKey
ALTER TABLE "EpaycoConfig" ADD CONSTRAINT "EpaycoConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
