-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('ONLINE', 'CAMPANHA');
CREATE TYPE "RoomStatus" AS ENUM ('ABERTA', 'CHEIA', 'ENCERRADA');

-- CreateTable
CREATE TABLE "jogadores" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jogador_favoritos" (
    "jogador_id" TEXT NOT NULL,
    "jogo_id" TEXT NOT NULL,
    CONSTRAINT "jogador_favoritos_pkey" PRIMARY KEY ("jogador_id","jogo_id")
);

CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jogos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jogo_modos" (
    "jogo_id" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    CONSTRAINT "jogo_modos_pkey" PRIMARY KEY ("jogo_id","mode")
);

CREATE TABLE "jogo_categorias" (
    "jogo_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    CONSTRAINT "jogo_categorias_pkey" PRIMARY KEY ("jogo_id","categoria_id")
);

CREATE TABLE "salas" (
    "id" TEXT NOT NULL,
    "jogo_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ABERTA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sala_participantes" (
    "sala_id" TEXT NOT NULL,
    "jogador_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sala_participantes_pkey" PRIMARY KEY ("sala_id","jogador_id")
);

CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "sala_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_email_key" ON "jogadores"("email");
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");
CREATE UNIQUE INDEX "jogos_slug_key" ON "jogos"("slug");
CREATE INDEX "jogo_categorias_categoria_id_idx" ON "jogo_categorias"("categoria_id");
CREATE INDEX "salas_jogo_id_status_idx" ON "salas"("jogo_id", "status");
CREATE INDEX "salas_status_idx" ON "salas"("status");
CREATE INDEX "mensagens_sala_id_sent_at_idx" ON "mensagens"("sala_id", "sent_at");

-- AddForeignKey
ALTER TABLE "jogador_favoritos" ADD CONSTRAINT "jogador_favoritos_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogador_favoritos" ADD CONSTRAINT "jogador_favoritos_jogo_id_fkey" FOREIGN KEY ("jogo_id") REFERENCES "jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogo_modos" ADD CONSTRAINT "jogo_modos_jogo_id_fkey" FOREIGN KEY ("jogo_id") REFERENCES "jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogo_categorias" ADD CONSTRAINT "jogo_categorias_jogo_id_fkey" FOREIGN KEY ("jogo_id") REFERENCES "jogos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogo_categorias" ADD CONSTRAINT "jogo_categorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salas" ADD CONSTRAINT "salas_jogo_id_fkey" FOREIGN KEY ("jogo_id") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "salas" ADD CONSTRAINT "salas_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sala_participantes" ADD CONSTRAINT "sala_participantes_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "salas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sala_participantes" ADD CONSTRAINT "sala_participantes_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "salas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
