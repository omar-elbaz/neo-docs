/*
  Warnings:

  - Added the required column `timestamp` to the `document_operations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `document_operations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_operations" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firstName" TEXT NOT NULL,

ADD COLUMN     "lastName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "document_activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "document_activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
