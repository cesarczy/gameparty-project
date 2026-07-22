-- Categoria active flag
ALTER TABLE "categorias" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Activity logs
DO $$ BEGIN
  CREATE TYPE "ActivityLogCategory" AS ENUM ('AUTH', 'PROFILE', 'ADMIN', 'SECURITY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityLogType" AS ENUM (
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'PASSWORD_CHANGED',
    'PASSWORD_RECOVERY',
    'EMAIL_VERIFIED',
    'DISPLAY_NAME_CHANGED',
    'AVATAR_CHANGED',
    'FAVORITES_CHANGED',
    'USER_BANNED',
    'ADMIN_USER_BANNED',
    'ADMIN_USER_UNBANNED',
    'ADMIN_ROLE_CHANGED',
    'ADMIN_REPORT_RECEIVED',
    'EMAIL_CHANGED',
    'PERMISSIONS_CHANGED',
    'NEW_DEVICE_LOGIN',
    'MANY_LOGIN_ATTEMPTS',
    'SESSION_ENDED',
    'GAME_DEACTIVATED',
    'GAME_ACTIVATED',
    'CATEGORY_DEACTIVATED',
    'CATEGORY_ACTIVATED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "registros_atividade" (
  "id" TEXT NOT NULL,
  "category" "ActivityLogCategory" NOT NULL,
  "type" "ActivityLogType" NOT NULL,
  "message" TEXT NOT NULL,
  "subject_id" TEXT,
  "actor_id" TEXT,
  "actor_name" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "registros_atividade_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "registros_atividade"
    ADD CONSTRAINT "registros_atividade_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "jogadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "registros_atividade"
    ADD CONSTRAINT "registros_atividade_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "jogadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "registros_atividade_subject_id_created_at_idx"
  ON "registros_atividade"("subject_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "registros_atividade_category_created_at_idx"
  ON "registros_atividade"("category", "created_at" DESC);
