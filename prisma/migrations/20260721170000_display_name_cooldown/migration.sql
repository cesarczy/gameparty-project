-- AlterTable
ALTER TABLE "jogadores" ADD COLUMN "display_name_changed_at" TIMESTAMP(3);

UPDATE "jogadores" SET "display_name_changed_at" = "created_at";

ALTER TABLE "jogadores" ALTER COLUMN "display_name_changed_at" SET NOT NULL;
ALTER TABLE "jogadores" ALTER COLUMN "display_name_changed_at" SET DEFAULT CURRENT_TIMESTAMP;
