ALTER TABLE "jogadores" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "jogadores" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "jogadores" ADD COLUMN IF NOT EXISTS "password_reset_expires_at" TIMESTAMP(3);

UPDATE "jogadores" SET "full_name" = "display_name" WHERE "full_name" IS NULL;
