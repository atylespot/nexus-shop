/*
  Warnings:

  - Added the required column `productId` to the `LandingPage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "EmailSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "host" TEXT,
    "port" INTEGER,
    "user" TEXT,
    "pass" TEXT,
    "from" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'SMTP',
    "apiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductPurchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    CONSTRAINT "ProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OtherExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BudgetEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2025,
    "expenseType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdProductEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2025,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "buyingPrice" REAL NOT NULL,
    "sellingPrice" REAL,
    "fbAdCost" REAL NOT NULL,
    "deliveryCost" REAL NOT NULL,
    "returnParcelQty" INTEGER NOT NULL DEFAULT 0,
    "returnCost" REAL NOT NULL DEFAULT 0,
    "damagedProductQty" INTEGER NOT NULL DEFAULT 0,
    "damagedCost" REAL NOT NULL DEFAULT 0,
    "monthlyBudget" REAL NOT NULL DEFAULT 0,
    "desiredProfitPct" REAL,
    "requiredMonthlyUnits" INTEGER,
    "requiredDailyUnits" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SellingTargetEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adProductEntryId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "targetUnits" INTEGER NOT NULL DEFAULT 0,
    "soldUnits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellingTargetEntry_adProductEntryId_fkey" FOREIGN KEY ("adProductEntryId") REFERENCES "AdProductEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roleId" INTEGER,
    "managerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "passwordHash" TEXT,
    "loginSlug" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    CONSTRAINT "AppUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AppUser_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "AppUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "effect" TEXT NOT NULL DEFAULT 'ALLOW',
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LandingPage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "productId" INTEGER NOT NULL,
    "headerImage" TEXT,
    "videoUrl" TEXT,
    "productDescription" TEXT,
    "regularPrice" TEXT,
    "discountPrice" TEXT,
    "blocks" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pixelIds" JSONB,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LandingPage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LandingPage" ("blocks", "createdAt", "id", "publishedAt", "slug", "status", "title", "updatedAt") SELECT "blocks", "createdAt", "id", "publishedAt", "slug", "status", "title", "updatedAt" FROM "LandingPage";
DROP TABLE "LandingPage";
ALTER TABLE "new_LandingPage" RENAME TO "LandingPage";
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
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
    "district" TEXT
);
INSERT INTO "new_Order" ("address", "createdAt", "currency", "customerName", "district", "fbEventId", "id", "orderNo", "paymentStatus", "phone", "shippingCost", "shippingMethod", "status", "subtotal", "total", "ttEventId", "updatedAt", "userEmail") SELECT "address", "createdAt", "currency", "customerName", "district", "fbEventId", "id", "orderNo", "paymentStatus", "phone", "shippingCost", "shippingMethod", "status", "subtotal", "total", "ttEventId", "updatedAt", "userEmail" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SellingTargetEntry_adProductEntryId_date_key" ON "SellingTargetEntry"("adProductEntryId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_userId_key" ON "AppUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_loginSlug_key" ON "AppUser"("loginSlug");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");
