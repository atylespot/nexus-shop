-- Nexus Shop Database Setup Script
-- Upload this file to phpMyAdmin and run it

-- Create database (if permission allows)
CREATE DATABASE IF NOT EXISTS `nexus_shop` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nexus_shop`;

-- Create all tables for Nexus Shop

-- Categories table
CREATE TABLE IF NOT EXISTS `Category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL UNIQUE,
  `imageUrl` varchar(500) DEFAULT NULL,
  `parentId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Category_parentId_fkey` (`parentId`),
  CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS `Product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL UNIQUE,
  `description` text DEFAULT NULL,
  `aiDescription` text DEFAULT NULL,
  `buyPrice` double NOT NULL,
  `regularPrice` double NOT NULL,
  `salePrice` double DEFAULT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'BDT',
  `sku` varchar(191) DEFAULT NULL UNIQUE,
  `status` varchar(191) NOT NULL DEFAULT 'DRAFT',
  `categoryId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Product_categoryId_fkey` (`categoryId`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Product Images table
CREATE TABLE IF NOT EXISTS `ProductImage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(500) NOT NULL,
  `alt` varchar(191) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `productId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductImage_productId_fkey` (`productId`),
  CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS `Inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL UNIQUE,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `lowStockThreshold` int(11) NOT NULL DEFAULT 2,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Inventory_productId_key` (`productId`),
  CONSTRAINT `Inventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS `Order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderNo` varchar(191) NOT NULL UNIQUE,
  `customerName` varchar(191) DEFAULT NULL,
  `userEmail` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'processing',
  `paymentStatus` varchar(191) NOT NULL DEFAULT 'UNPAID',
  `shippingMethod` varchar(191) DEFAULT NULL,
  `shippingCost` double DEFAULT NULL,
  `subtotal` double NOT NULL,
  `total` double NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'BDT',
  `fbEventId` varchar(191) DEFAULT NULL,
  `ttEventId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `address` varchar(500) DEFAULT NULL,
  `district` varchar(191) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS `OrderItem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_fkey` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Customers table
CREATE TABLE IF NOT EXISTS `Customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL UNIQUE,
  `phone` varchar(191) DEFAULT NULL UNIQUE,
  `passwordHash` varchar(191) NOT NULL,
  `avatarUrl` varchar(500) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Courier Settings table
CREATE TABLE IF NOT EXISTS `CourierSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiKey` varchar(191) NOT NULL,
  `secretKey` varchar(191) NOT NULL,
  `baseUrl` varchar(191) NOT NULL DEFAULT 'https://portal.packzy.com/api/v1',
  `isActive` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Courier Orders table
CREATE TABLE IF NOT EXISTS `CourierOrder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL UNIQUE,
  `orderType` varchar(191) NOT NULL DEFAULT 'website',
  `consignmentId` varchar(191) DEFAULT NULL,
  `trackingCode` varchar(191) DEFAULT NULL,
  `courierStatus` varchar(191) NOT NULL DEFAULT 'pending',
  `courierNote` text DEFAULT NULL,
  `deliveryCharge` double DEFAULT NULL,
  `courierResponse` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS `SiteSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `header` json DEFAULT NULL,
  `banner` json DEFAULT NULL,
  `footer` json DEFAULT NULL,
  `general` json DEFAULT NULL,
  `payment` json DEFAULT NULL,
  `shipping` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Pixel Settings table
CREATE TABLE IF NOT EXISTS `PixelSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fbPixelId` varchar(191) DEFAULT NULL,
  `fbAccessToken` varchar(500) DEFAULT NULL,
  `fbTestEventCode` varchar(191) DEFAULT NULL,
  `testEventCodeCreatedAt` datetime(3) DEFAULT NULL,
  `ttPixelId` varchar(191) DEFAULT NULL,
  `ttAccessToken` varchar(500) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Landing Pages table
CREATE TABLE IF NOT EXISTS `LandingPage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) NOT NULL UNIQUE,
  `title` varchar(191) NOT NULL,
  `subtitle` varchar(191) DEFAULT NULL,
  `productId` int(11) NOT NULL,
  `headerImage` varchar(500) DEFAULT NULL,
  `videoUrl` varchar(500) DEFAULT NULL,
  `productDescription` text DEFAULT NULL,
  `regularPrice` varchar(191) DEFAULT NULL,
  `discountPrice` varchar(191) DEFAULT NULL,
  `productImages` json DEFAULT NULL,
  `productFeatures` text DEFAULT NULL,
  `customerReviews` json DEFAULT NULL,
  `shippingAreas` json DEFAULT NULL,
  `freeDelivery` tinyint(1) NOT NULL DEFAULT 0,
  `blocks` json DEFAULT NULL,
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'draft',
  `pixelIds` json DEFAULT NULL,
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `LandingPage_productId_fkey` (`productId`),
  CONSTRAINT `LandingPage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Landing Page Orders table
CREATE TABLE IF NOT EXISTS `LandingPageOrder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerName` varchar(191) NOT NULL,
  `customerPhone` varchar(191) NOT NULL,
  `customerAddress` varchar(500) NOT NULL,
  `productId` int(11) NOT NULL,
  `productName` varchar(191) NOT NULL,
  `productPrice` double NOT NULL,
  `deliveryCharge` double NOT NULL DEFAULT 0,
  `totalAmount` double NOT NULL,
  `deliveryArea` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'processing',
  `landingPageId` int(11) NOT NULL,
  `orderDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paymentMethod` varchar(191) NOT NULL DEFAULT 'cash_on_delivery',
  `customerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `LandingPageOrder_productId_fkey` (`productId`),
  CONSTRAINT `LandingPageOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Email Settings table
CREATE TABLE IF NOT EXISTS `EmailSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `host` varchar(191) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `user` varchar(191) DEFAULT NULL,
  `pass` varchar(191) DEFAULT NULL,
  `from` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 0,
  `provider` varchar(191) NOT NULL DEFAULT 'SMTP',
  `apiKey` varchar(500) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Chat Bot Settings table
CREATE TABLE IF NOT EXISTS `ChatBotSetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `isEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `welcomeMessage` varchar(500) NOT NULL DEFAULT 'স্বাগতম! আমি আপনার সাহায্য করতে পারি।',
  `aiModel` varchar(191) NOT NULL DEFAULT 'gpt-4o-mini',
  `maxTokens` int(11) NOT NULL DEFAULT 1000,
  `temperature` double NOT NULL DEFAULT 0.7,
  `systemPrompt` text NOT NULL DEFAULT 'You are a helpful AI assistant for an e-commerce website. Respond in Bengali (Bangla) language. Help customers with product information, orders, and general queries.',
  `autoResponseDelay` int(11) NOT NULL DEFAULT 1000,
  `workingHours` json DEFAULT NULL,
  `offlineMessage` varchar(500) NOT NULL DEFAULT 'আমরা এখন অফলাইনে আছি। আপনার মেসেজ রেখে দিন, আমরা শীঘ্রই যোগাযোগ করব।',
  `openaiApiKey` varchar(500) DEFAULT NULL,
  `contactEmail` varchar(191) DEFAULT NULL,
  `contactWhatsApp` varchar(191) DEFAULT NULL,
  `contactWebsite` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS `ChatSession` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(191) NOT NULL UNIQUE,
  `customerName` varchar(191) DEFAULT NULL,
  `customerPhone` varchar(191) DEFAULT NULL,
  `customerEmail` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `source` varchar(191) NOT NULL DEFAULT 'website',
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS `ChatMessage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sessionId` int(11) NOT NULL,
  `content` text NOT NULL,
  `messageType` varchar(191) NOT NULL DEFAULT 'text',
  `senderType` varchar(191) NOT NULL DEFAULT 'customer',
  `senderName` varchar(191) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ChatMessage_sessionId_fkey` (`sessionId`),
  CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Sizes table
CREATE TABLE IF NOT EXISTS `Size` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL UNIQUE,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Colors table
CREATE TABLE IF NOT EXISTS `Color` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL UNIQUE,
  `hexCode` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

-- Product Variations table
CREATE TABLE IF NOT EXISTS `ProductVariation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `sizeId` int(11) DEFAULT NULL,
  `colorId` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `price` double DEFAULT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `sku` varchar(191) DEFAULT NULL UNIQUE,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductVariation_productId_sizeId_colorId_key` (`productId`,`sizeId`,`colorId`),
  KEY `ProductVariation_sizeId_fkey` (`sizeId`),
  KEY `ProductVariation_colorId_fkey` (`colorId`),
  CONSTRAINT `ProductVariation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductVariation_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `Size` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ProductVariation_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `Color` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Customer Journey Events table
CREATE TABLE IF NOT EXISTS `CustomerJourneyEvent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source` varchar(191) NOT NULL DEFAULT 'website',
  `pageType` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'view',
  `fullName` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `sessionId` varchar(191) DEFAULT NULL,
  `customerName` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `district` varchar(191) DEFAULT NULL,
  `thana` varchar(191) DEFAULT NULL,
  `productId` int(11) DEFAULT NULL,
  `productName` varchar(191) DEFAULT NULL,
  `productImage` varchar(500) DEFAULT NULL,
  `landingPageId` int(11) DEFAULT NULL,
  `landingPageSlug` varchar(191) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `eventTime` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CustomerJourneyEvent_status_eventTime_idx` (`status`,`eventTime`),
  KEY `CustomerJourneyEvent_source_eventTime_idx` (`source`,`eventTime`)
);

-- Insert sample category
INSERT IGNORE INTO `Category` (`id`, `name`, `slug`, `imageUrl`, `parentId`, `createdAt`, `updatedAt`) VALUES
(1, 'General', 'general', NULL, NULL, NOW(), NOW());

-- Insert sample product
INSERT IGNORE INTO `Product` (`id`, `name`, `slug`, `description`, `buyPrice`, `regularPrice`, `salePrice`, `currency`, `status`, `categoryId`, `createdAt`, `updatedAt`) VALUES
(1, 'Sample Product', 'sample-product', 'This is a sample product for testing', 100.00, 150.00, 120.00, 'BDT', 'PUBLISHED', 1, NOW(), NOW());

-- Insert sample inventory
INSERT IGNORE INTO `Inventory` (`productId`, `quantity`, `lowStockThreshold`) VALUES
(1, 50, 5);

-- Insert default site settings
INSERT IGNORE INTO `SiteSetting` (`id`, `header`, `banner`, `footer`, `general`, `payment`, `shipping`, `createdAt`, `updatedAt`) VALUES
(1, '{}', '{}', '{}', '{}', '{}', '{}', NOW(), NOW());

-- Insert default pixel settings
INSERT IGNORE INTO `PixelSetting` (`id`, `enabled`, `createdAt`, `updatedAt`) VALUES
(1, 0, NOW(), NOW());

-- Insert default email settings
INSERT IGNORE INTO `EmailSetting` (`id`, `isActive`, `provider`, `createdAt`, `updatedAt`) VALUES
(1, 0, 'SMTP', NOW(), NOW());

-- Insert default chat bot settings
INSERT IGNORE INTO `ChatBotSetting` (`id`, `createdAt`, `updatedAt`) VALUES
(1, NOW(), NOW());

-- Success message
SELECT 'Database setup completed successfully! Tables created and sample data inserted.' AS Status;
