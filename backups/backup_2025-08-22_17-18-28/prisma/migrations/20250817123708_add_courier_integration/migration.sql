-- CreateTable
CREATE TABLE "CourierSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://portal.packzy.com/api/v1',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CourierOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "consignmentId" TEXT,
    "trackingCode" TEXT,
    "courierStatus" TEXT NOT NULL DEFAULT 'pending',
    "courierNote" TEXT,
    "courierResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourierOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CourierOrder_orderId_key" ON "CourierOrder"("orderId");
