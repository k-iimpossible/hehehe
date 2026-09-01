-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceFlags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upwork" BOOLEAN NOT NULL DEFAULT false,
    "freelancer" BOOLEAN NOT NULL DEFAULT false,
    "outlier" BOOLEAN NOT NULL DEFAULT false,
    "handshake" BOOLEAN NOT NULL DEFAULT false,
    "snorkel" BOOLEAN NOT NULL DEFAULT false,
    "afterquery" BOOLEAN NOT NULL DEFAULT false,
    "meridial" BOOLEAN NOT NULL DEFAULT false,
    "mercor" BOOLEAN NOT NULL DEFAULT false,
    "micro1" BOOLEAN NOT NULL DEFAULT false,
    "alignerr" BOOLEAN NOT NULL DEFAULT false,
    "bankCreate" BOOLEAN NOT NULL DEFAULT false,
    "paypalCreate" BOOLEAN NOT NULL DEFAULT false,
    "payoneerCreate" BOOLEAN NOT NULL DEFAULT false,
    "documentEdit" BOOLEAN NOT NULL DEFAULT false,
    "personalInfoLookup" BOOLEAN NOT NULL DEFAULT false,
    "drugTest" BOOLEAN NOT NULL DEFAULT false,
    "laptopHost" BOOLEAN NOT NULL DEFAULT false,
    "paypalRemoveHold" BOOLEAN NOT NULL DEFAULT false,
    "contactUs" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accountId_key" ON "User"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceFlags_userId_key" ON "ServiceFlags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- AddForeignKey
ALTER TABLE "ServiceFlags" ADD CONSTRAINT "ServiceFlags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
