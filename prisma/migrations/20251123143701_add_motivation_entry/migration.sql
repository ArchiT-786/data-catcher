/*
  Warnings:

  - You are about to drop the `UserRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "UserRequest";

-- CreateTable
CREATE TABLE "MotivationEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "about" TEXT NOT NULL,
    "dream" TEXT NOT NULL,
    "imageBase64" TEXT,
    "score" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,

    CONSTRAINT "MotivationEntry_pkey" PRIMARY KEY ("id")
);
