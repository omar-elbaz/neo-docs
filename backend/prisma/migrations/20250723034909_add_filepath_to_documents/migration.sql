-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "filePath" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
