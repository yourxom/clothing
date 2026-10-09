-- Migration: add_payments_system
-- Adds the dual-mode UPI payment system tables and enums.
-- Part of: Merchant UPI (automatic) + Personal UPI (manual verification)

-- ─── New Enum types ───────────────────────────────────────────────────────────
-- MySQL stores enums inline on columns; no separate type creation needed.

-- ─── PaymentSettings (singleton admin config) ─────────────────────────────────
CREATE TABLE `PaymentSettings` (
    `id` VARCHAR(191) NOT NULL,
    `merchantUpiEnabled` BOOLEAN NOT NULL DEFAULT false,
    `personalUpiEnabled` BOOLEAN NOT NULL DEFAULT false,
    `defaultMethod` ENUM('MERCHANT_UPI', 'PERSONAL_UPI') NOT NULL DEFAULT 'PERSONAL_UPI',
    `merchantProvider` VARCHAR(60) NULL,
    `merchantName` VARCHAR(100) NULL,
    `merchantMerchantId` VARCHAR(100) NULL,
    `merchantVpa` VARCHAR(100) NULL,
    `merchantApiKeyEnc` TEXT NULL,
    `merchantApiSecretEnc` TEXT NULL,
    `merchantWebhookSecretEnc` TEXT NULL,
    `merchantEnvironment` VARCHAR(191) NOT NULL DEFAULT 'test',
    `merchantAutoVerify` BOOLEAN NOT NULL DEFAULT true,
    `personalAccountName` VARCHAR(100) NULL,
    `personalUpiId` VARCHAR(100) NULL,
    `personalQrImageUrl` VARCHAR(500) NULL,
    `personalBankName` VARCHAR(100) NULL,
    `personalInstructions` TEXT NULL,
    `personalUseDynamicQr` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Payment ───────────────────────────────────────────────────────────────────
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `paymentMethod` ENUM('MERCHANT_UPI', 'PERSONAL_UPI') NOT NULL,
    `provider` VARCHAR(191) NULL,
    `providerPaymentId` VARCHAR(191) NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `providerSignature` VARCHAR(191) NULL,
    `expectedAmountPaise` INTEGER NOT NULL,
    `receivedAmountPaise` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `utr` VARCHAR(191) NULL,
    `screenshotUrl` TEXT NULL,
    `possibleDuplicate` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING_PAYMENT','UNDER_REVIEW','PAID','FAILED','REJECTED','EXPIRED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `verificationType` ENUM('AUTOMATIC', 'MANUAL') NOT NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `verifiedBySystem` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `Payment_orderId_idx` (`orderId`),
    INDEX `Payment_userId_idx` (`userId`),
    INDEX `Payment_status_idx` (`status`),
    INDEX `Payment_paymentMethod_status_idx` (`paymentMethod`, `status`),
    INDEX `Payment_utr_idx` (`utr`),
    INDEX `Payment_providerPaymentId_idx` (`providerPaymentId`),
    INDEX `Payment_providerOrderId_idx` (`providerOrderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── PaymentEvent (audit trail) ───────────────────────────────────────────────
CREATE TABLE `PaymentEvent` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('PAYMENT_CREATED','CUSTOMER_SUBMITTED_PAYMENT','WEBHOOK_RECEIVED','PAYMENT_VERIFIED','PAYMENT_REJECTED','PAYMENT_EXPIRED','REFUND_CREATED','SETTINGS_UPDATED') NOT NULL,
    `oldStatus` ENUM('PENDING_PAYMENT','UNDER_REVIEW','PAID','FAILED','REJECTED','EXPIRED','REFUNDED','PARTIALLY_REFUNDED') NULL,
    `newStatus` ENUM('PENDING_PAYMENT','UNDER_REVIEW','PAID','FAILED','REJECTED','EXPIRED','REFUNDED','PARTIALLY_REFUNDED') NULL,
    `source` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `PaymentEvent_paymentId_idx` (`paymentId`),
    INDEX `PaymentEvent_eventType_idx` (`eventType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── WebhookEvent (idempotency guard) ────────────────────────────────────────
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `WebhookEvent_provider_eventId_key` (`provider`, `eventId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PaymentEvent` ADD CONSTRAINT `PaymentEvent_paymentId_fkey`
    FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Extend Order table with payments relation backref (no SQL needed — Prisma relation) ─
-- The payments[] relation on Order is a virtual Prisma relation; no ALTER TABLE needed.

-- ─── Previous migrations' deferred schema additions ──────────────────────────
-- These columns exist in the Prisma schema from earlier work but weren't in
-- the original migration files (applied directly to DB in dev). Adding them
-- here so the migration history is accurate after the db reset.

ALTER TABLE `User`
    ADD COLUMN IF NOT EXISTS `pointsBalance` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `referralCode` VARCHAR(191) NULL,
    ADD COLUMN IF NOT EXISTS `referredById` VARCHAR(191) NULL,
    ADD COLUMN IF NOT EXISTS `phoneVerified` BOOLEAN NOT NULL DEFAULT false;

-- Add unique/index constraints for User additions (IF NOT EXISTS not supported
-- in older MySQL for indexes; use CREATE UNIQUE INDEX with error suppression via
-- a stored procedure alternative — we use a conditional approach).
-- Safer: attempt and let Prisma handle via the schema going forward.
CREATE UNIQUE INDEX IF NOT EXISTS `User_referralCode_key` ON `User`(`referralCode`);
CREATE UNIQUE INDEX IF NOT EXISTS `User_phone_key` ON `User`(`phone`);
CREATE INDEX IF NOT EXISTS `User_referredById_idx` ON `User`(`referredById`);

ALTER TABLE `Order`
    ADD COLUMN IF NOT EXISTS `pointsUsedPaise` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `referralRewarded` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `SavedItem`
    ADD COLUMN IF NOT EXISTS `color` VARCHAR(191) NULL;

ALTER TABLE `ProductImage`
    ADD COLUMN IF NOT EXISTS `color` VARCHAR(191) NULL;

-- Create tables that were added in code but may not be in migration history
CREATE TABLE IF NOT EXISTS `UserCoupon` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `redeemedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UserCoupon_userId_couponId_key` (`userId`, `couponId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CouponRedemption` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `discountPaise` INTEGER NOT NULL,
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PointsLedger` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Coupon`
    ADD COLUMN IF NOT EXISTS `isWelcome` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS `scope` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS `singleUse` BOOLEAN NOT NULL DEFAULT false;
