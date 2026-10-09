-- AlterTable
ALTER TABLE `address` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `trackingNumber` VARCHAR(191) NULL,
    ADD COLUMN `trackingProvider` VARCHAR(191) NULL;
