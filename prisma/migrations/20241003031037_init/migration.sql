/*
  Warnings:

  - You are about to drop the column `containerId` on the `Cart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_containerId_fkey";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "containerId";

-- CreateTable
CREATE TABLE "_ProductCarts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductCarts_AB_unique" ON "_ProductCarts"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductCarts_B_index" ON "_ProductCarts"("B");

-- AddForeignKey
ALTER TABLE "_ProductCarts" ADD CONSTRAINT "_ProductCarts_A_fkey" FOREIGN KEY ("A") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCarts" ADD CONSTRAINT "_ProductCarts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
