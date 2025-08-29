-- AlterTable
ALTER TABLE "PixelSetting" ADD COLUMN "testEventCodeCreatedAt" DATETIME;

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'website',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "senderType" TEXT NOT NULL DEFAULT 'customer',
    "senderName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatBotSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'স্বাগতম! আমি আপনার সাহায্য করতে পারি।',
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful AI assistant for an e-commerce website. Respond in Bengali (Bangla) language. Help customers with product information, orders, and general queries.',
    "autoResponseDelay" INTEGER NOT NULL DEFAULT 1000,
    "workingHours" JSONB,
    "offlineMessage" TEXT NOT NULL DEFAULT 'আমরা এখন অফলাইনে আছি। আপনার মেসেজ রেখে দিন, আমরা শীঘ্রই যোগাযোগ করব।',
    "openaiApiKey" TEXT,
    "contactEmail" TEXT,
    "contactWhatsApp" TEXT,
    "contactWebsite" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON "ChatSession"("sessionId");
