-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualities" JSONB;
