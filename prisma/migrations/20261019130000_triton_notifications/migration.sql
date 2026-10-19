-- CreateTable
CREATE TABLE "TritonNotification" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winnerAccount" TEXT,
    "winnerSelected" BOOLEAN NOT NULL DEFAULT false,
    "autoRefreshConsumed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TritonNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TritonDelivery" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TritonDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TritonSpecialCall" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "accountName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TritonSpecialCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TritonNotification_createdAt_idx" ON "TritonNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TritonDelivery_notificationId_accountName_key" ON "TritonDelivery"("notificationId", "accountName");

-- CreateIndex
CREATE INDEX "TritonSpecialCall_notificationId_idx" ON "TritonSpecialCall"("notificationId");

-- AddForeignKey
ALTER TABLE "TritonDelivery" ADD CONSTRAINT "TritonDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "TritonNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TritonSpecialCall" ADD CONSTRAINT "TritonSpecialCall_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "TritonNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
