-- AlterTable
ALTER TABLE "jogadores" ADD COLUMN "email_changed_at" TIMESTAMP(3);

UPDATE "jogadores" SET "email_changed_at" = "created_at";

ALTER TABLE "jogadores" ALTER COLUMN "email_changed_at" SET NOT NULL;
ALTER TABLE "jogadores" ALTER COLUMN "email_changed_at" SET DEFAULT CURRENT_TIMESTAMP;
