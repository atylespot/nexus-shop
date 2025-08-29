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
    "productImages" JSONB,
    "productFeatures" TEXT,
    "blocks" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pixelIds" JSONB,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LandingPage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LandingPage" ("blocks", "createdAt", "discountPrice", "headerImage", "id", "pixelIds", "productDescription", "productFeatures", "productId", "productImages", "publishedAt", "regularPrice", "slug", "status", "subtitle", "title", "updatedAt", "videoUrl") SELECT "blocks", "createdAt", "discountPrice", "headerImage", "id", "pixelIds", "productDescription", "productFeatures", "productId", "productImages", "publishedAt", "regularPrice", "slug", "status", "subtitle", "title", "updatedAt", "videoUrl" FROM "LandingPage";
DROP TABLE "LandingPage";
ALTER TABLE "new_LandingPage" RENAME TO "LandingPage";
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
