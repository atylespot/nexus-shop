-- CreateTable
CREATE TABLE "ManualCourierPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "deliveryCharge" REAL,
    "codCharge" REAL,
    "adjustment" REAL,
    "statementNo" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerInfoSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "offerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "offerDelaySeconds" INTEGER NOT NULL DEFAULT 10,
    "offerTitle" TEXT,
    "offerMessage" TEXT,
    "offerCtaText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JourneyRetentionSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CheckoutOfferSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scope" TEXT NOT NULL DEFAULT 'website',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "delaySeconds" INTEGER NOT NULL DEFAULT 10,
    "title" TEXT,
    "message" TEXT,
    "ctaText" TEXT,
    "imageUrl" TEXT,
    "productId" INTEGER,
    "landingPageId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerJourneyEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "pageType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'view',
    "fullName" TEXT,
    "email" TEXT,
    "sessionId" TEXT,
    "customerName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "district" TEXT,
    "thana" TEXT,
    "productId" INTEGER,
    "productName" TEXT,
    "productImage" TEXT,
    "landingPageId" INTEGER,
    "landingPageSlug" TEXT,
    "orderId" INTEGER,
    "eventTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actorId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LandingPageOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productPrice" REAL NOT NULL,
    "deliveryCharge" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "deliveryArea" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "landingPageId" INTEGER NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash_on_delivery',
    "customerId" INTEGER,
    CONSTRAINT "LandingPageOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LandingPageOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LandingPageOrder" ("customerAddress", "customerName", "customerPhone", "deliveryArea", "deliveryCharge", "id", "landingPageId", "orderDate", "paymentMethod", "productId", "productName", "productPrice", "status", "totalAmount") SELECT "customerAddress", "customerName", "customerPhone", "deliveryArea", "deliveryCharge", "id", "landingPageId", "orderDate", "paymentMethod", "productId", "productName", "productPrice", "status", "totalAmount" FROM "LandingPageOrder";
DROP TABLE "LandingPageOrder";
ALTER TABLE "new_LandingPageOrder" RENAME TO "LandingPageOrder";
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "customerName" TEXT,
    "userEmail" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "shippingMethod" TEXT,
    "shippingCost" REAL,
    "subtotal" REAL NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "fbEventId" TEXT,
    "ttEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "customerId" INTEGER,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "createdAt", "currency", "customerName", "district", "fbEventId", "id", "orderNo", "paymentStatus", "phone", "shippingCost", "shippingMethod", "status", "subtotal", "total", "ttEventId", "updatedAt", "userEmail") SELECT "address", "createdAt", "currency", "customerName", "district", "fbEventId", "id", "orderNo", "paymentStatus", "phone", "shippingCost", "shippingMethod", "status", "subtotal", "total", "ttEventId", "updatedAt", "userEmail" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CheckoutOfferSetting_scope_idx" ON "CheckoutOfferSetting"("scope");

-- CreateIndex
CREATE INDEX "CheckoutOfferSetting_productId_idx" ON "CheckoutOfferSetting"("productId");

-- CreateIndex
CREATE INDEX "CheckoutOfferSetting_landingPageId_idx" ON "CheckoutOfferSetting"("landingPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "CustomerJourneyEvent_status_eventTime_idx" ON "CustomerJourneyEvent"("status", "eventTime");

-- CreateIndex
CREATE INDEX "CustomerJourneyEvent_source_eventTime_idx" ON "CustomerJourneyEvent"("source", "eventTime");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
