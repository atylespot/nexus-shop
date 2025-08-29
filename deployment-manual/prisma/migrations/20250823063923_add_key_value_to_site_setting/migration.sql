/*
  Warnings:

  - Added the required column `key` to the `SiteSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `SiteSetting` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CourierOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "orderType" TEXT NOT NULL DEFAULT 'website',
    "consignmentId" TEXT,
    "trackingCode" TEXT,
    "courierStatus" TEXT NOT NULL DEFAULT 'pending',
    "courierNote" TEXT,
    "deliveryCharge" REAL,
    "courierResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CourierOrder" ("consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "trackingCode", "updatedAt") SELECT "consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "trackingCode", "updatedAt" FROM "CourierOrder";
DROP TABLE "CourierOrder";
ALTER TABLE "new_CourierOrder" RENAME TO "CourierOrder";
CREATE UNIQUE INDEX "CourierOrder_orderId_key" ON "CourierOrder"("orderId");
CREATE TABLE "new_SiteSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
