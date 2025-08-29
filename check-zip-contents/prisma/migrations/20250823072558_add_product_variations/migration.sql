/*
  Warnings:

  - You are about to drop the column `orderType` on the `CourierOrder` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `SiteSetting` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `SiteSetting` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Size" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Color" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "hexCode" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductVariation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "colorId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" REAL,
    "imageUrl" TEXT,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductVariation_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductVariation_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CourierOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "consignmentId" TEXT,
    "trackingCode" TEXT,
    "courierStatus" TEXT NOT NULL DEFAULT 'pending',
    "courierNote" TEXT,
    "deliveryCharge" REAL,
    "courierResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourierOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CourierOrder" ("consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "trackingCode", "updatedAt") SELECT "consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "trackingCode", "updatedAt" FROM "CourierOrder";
DROP TABLE "CourierOrder";
ALTER TABLE "new_CourierOrder" RENAME TO "CourierOrder";
CREATE UNIQUE INDEX "CourierOrder_orderId_key" ON "CourierOrder"("orderId");
CREATE TABLE "new_SiteSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "header" JSONB,
    "banner" JSONB,
    "footer" JSONB,
    "general" JSONB,
    "payment" JSONB,
    "shipping" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSetting" ("banner", "createdAt", "footer", "general", "header", "id", "payment", "shipping", "updatedAt") SELECT "banner", "createdAt", "footer", "general", "header", "id", "payment", "shipping", "updatedAt" FROM "SiteSetting";
DROP TABLE "SiteSetting";
ALTER TABLE "new_SiteSetting" RENAME TO "SiteSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Size_name_key" ON "Size"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariation_sku_key" ON "ProductVariation"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariation_productId_sizeId_colorId_key" ON "ProductVariation"("productId", "sizeId", "colorId");
