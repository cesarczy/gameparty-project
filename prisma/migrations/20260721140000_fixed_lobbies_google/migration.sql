DELETE FROM mensagens;
DELETE FROM sala_participantes;
DELETE FROM salas;
ALTER TABLE "jogadores" ALTER COLUMN "senha_hash" DROP NOT NULL;
ALTER TABLE "jogadores" ADD COLUMN "google_id" TEXT;
ALTER TABLE "jogadores" ADD COLUMN "avatar_url" TEXT;
CREATE UNIQUE INDEX "jogadores_google_id_key" ON "jogadores"("google_id");

ALTER TABLE "salas" ADD COLUMN "is_fixed" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "salas_jogo_id_key" ON "salas"("jogo_id");
