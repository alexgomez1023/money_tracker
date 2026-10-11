-- CreateTable
CREATE TABLE `DiscoveredOffer` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `offer` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `url` TEXT NOT NULL,
    `eligibility` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `discoveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DiscoveredOffer_userId_idx`(`userId`),
    UNIQUE INDEX `DiscoveredOffer_userId_name_offer_key`(`userId`, `name`, `offer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DiscoveredOffer` ADD CONSTRAINT `DiscoveredOffer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
