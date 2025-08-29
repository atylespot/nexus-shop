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
INSERT INTO "new_CourierOrder" ("consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "orderType", "trackingCode", "updatedAt") SELECT "consignmentId", "courierNote", "courierResponse", "courierStatus", "createdAt", "deliveryCharge", "id", "orderId", "orderType", "trackingCode", "updatedAt" FROM "CourierOrder";
DROP TABLE "CourierOrder";
ALTER TABLE "new_CourierOrder" RENAME TO "CourierOrder";
CREATE UNIQUE INDEX "CourierOrder_orderId_key" ON "CourierOrder"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
