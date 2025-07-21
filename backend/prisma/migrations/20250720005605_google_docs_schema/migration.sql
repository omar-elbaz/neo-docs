/*
  Warnings:

  - You are about to drop the column `filePath` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `documents` table. All the data in the column will be lost.
  - The `content` column on the `documents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `document_versions` table. If the table is not empty, all the data it contains will be lost.
  - The required column `revisionId` was added to the `documents` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "document_versions" DROP CONSTRAINT "document_versions_documentId_fkey";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "filePath",
DROP COLUMN "fileSize",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedBy" TEXT,
ADD COLUMN     "revisionId" TEXT NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB;

-- DropTable
DROP TABLE "document_versions";

-- CreateTable
CREATE TABLE "document_operations" (
    "id" TEXT NOT NULL,
    "operation" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "document_operations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_lastEditedBy_fkey" FOREIGN KEY ("lastEditedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_operations" ADD CONSTRAINT "document_operations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
