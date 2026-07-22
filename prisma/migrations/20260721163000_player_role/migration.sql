-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('PLAYER', 'ADMIN');

-- AlterTable
ALTER TABLE "jogadores" ADD COLUMN "role" "PlayerRole" NOT NULL DEFAULT 'PLAYER';
