-- AlterTable
ALTER TABLE "jogadores" ADD COLUMN "profanity_filter_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "jogadores" ADD COLUMN "chat_online" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "jogadores" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "jogadores" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'pt-BR';
ALTER TABLE "jogadores" ADD COLUMN "last_seen_at" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('PENDING', 'ACCEPTED');
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'TOXICIDADE', 'OFENSA', 'ASSEDIO', 'HACK', 'FAKE', 'OUTRO');
CREATE TYPE "ReportStatus" AS ENUM ('ABERTA', 'ANALISANDO', 'RESOLVIDA', 'REJEITADA');
CREATE TYPE "NotificationType" AS ENUM ('AMIZADE', 'MENSAGEM', 'CONVITE', 'DENUNCIA');

-- CreateTable
CREATE TABLE "jogador_amizades" (
    "requester_id" TEXT NOT NULL,
    "addressee_id" TEXT NOT NULL,
    "status" "FriendStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jogador_amizades_pkey" PRIMARY KEY ("requester_id","addressee_id")
);

CREATE TABLE "jogador_bloqueios" (
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jogador_bloqueios_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'ABERTA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "jogador_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mensagens_privadas" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "mensagens_privadas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jogador_amizades" ADD CONSTRAINT "jogador_amizades_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogador_amizades" ADD CONSTRAINT "jogador_amizades_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogador_bloqueios" ADD CONSTRAINT "jogador_bloqueios_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jogador_bloqueios" ADD CONSTRAINT "jogador_bloqueios_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensagens_privadas" ADD CONSTRAINT "mensagens_privadas_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensagens_privadas" ADD CONSTRAINT "mensagens_privadas_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "denuncias_status_idx" ON "denuncias"("status");
CREATE INDEX "notificacoes_jogador_id_read_idx" ON "notificacoes"("jogador_id", "read");
CREATE INDEX "mensagens_privadas_sender_id_receiver_id_sent_at_idx" ON "mensagens_privadas"("sender_id", "receiver_id", "sent_at");
CREATE INDEX "mensagens_privadas_receiver_id_read_at_idx" ON "mensagens_privadas"("receiver_id", "read_at");
