-- Username único + campos de cadastro
ALTER TABLE "jogadores" ADD COLUMN "username" TEXT;
ALTER TABLE "jogadores" ADD COLUMN "birth_date" TIMESTAMP(3);
ALTER TABLE "jogadores" ADD COLUMN "country" TEXT;
ALTER TABLE "jogadores" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "jogadores" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "jogadores" ADD COLUMN "email_verification_token" TEXT;

UPDATE "jogadores"
SET "username" = LOWER(REGEXP_REPLACE(COALESCE(NULLIF("display_name", ''), 'user'), '[^a-zA-Z0-9]', '', 'g'))
  || '_' || SUBSTRING("id", 1, 8),
    "terms_accepted_at" = COALESCE("created_at", NOW()),
    "email_verified" = true
WHERE "username" IS NULL;

ALTER TABLE "jogadores" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "jogadores_username_key" ON "jogadores"("username");
