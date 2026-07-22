import { getPrismaClient } from '../src/shared/infrastructure/database/prisma.client.js';
import bcrypt from 'bcryptjs';
import { GameMode } from '../src/modules/catalog/domain/value-objects/game-mode.vo.js';
import { Categoria } from '../src/modules/catalog/domain/categoria/categoria.aggregate.js';
import { Jogo } from '../src/modules/catalog/domain/jogo/jogo.aggregate.js';
import { CategoriaMapper } from '../src/modules/catalog/infrastructure/persistence/categoria.mapper.js';
import { JogoMapper } from '../src/modules/catalog/infrastructure/persistence/jogo.mapper.js';
import {
  CATEGORIES,
  FIXED_LOBBY_CAPACITY,
  GAMES,
  slugify,
  SYSTEM_USER_EMAIL,
} from './catalog-data.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@gameparty.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345678';

const prisma = getPrismaClient();

async function ensureSystemUser(): Promise<string> {
  const existing = await prisma.jogador.findUnique({ where: { email: SYSTEM_USER_EMAIL } });
  if (existing) {
    await prisma.jogador.update({
      where: { email: SYSTEM_USER_EMAIL },
      data: { chatOnline: false },
    });
    return existing.id;
  }

  const created = await prisma.jogador.create({
    data: {
      username: 'gameparty',
      email: SYSTEM_USER_EMAIL,
      displayName: 'GameParty',
      senhaHash: null,
      emailVerified: true,
      termsAcceptedAt: new Date(),
      chatOnline: false,
    },
  });
  return created.id;
}

async function ensureAdminUser(): Promise<void> {
  const senhaHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.jogador.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      username: 'admin',
      email: ADMIN_EMAIL,
      displayName: 'Administrador',
      fullName: 'Administrador',
      senhaHash,
      role: 'ADMIN',
      rankId: 'satoru-gojo',
      emailVerified: true,
      termsAcceptedAt: new Date(),
    },
    update: {
      username: 'admin',
      displayName: 'Administrador',
      role: 'ADMIN',
      rankId: 'satoru-gojo',
      senhaHash,
    },
  });
}

async function ensureFixedLobby(jogoId: string, gameName: string, creatorId: string) {
  await prisma.sala.upsert({
    where: { jogoId },
    create: {
      jogoId,
      creatorId,
      title: `Lobby — ${gameName}`,
      mode: GameMode.ONLINE,
      capacity: FIXED_LOBBY_CAPACITY,
      isFixed: true,
      status: 'ABERTA',
    },
    update: {
      title: `Lobby — ${gameName}`,
      isFixed: true,
      status: 'ABERTA',
      capacity: FIXED_LOBBY_CAPACITY,
    },
  });
}

async function main() {
  const categoryMap = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const categoria = Categoria.create(cat);
    const data = CategoriaMapper.toPersistence(categoria);
    const row = await prisma.categoria.upsert({
      where: { slug: data.slug },
      create: data,
      update: { name: data.name },
    });
    categoryMap.set(cat.slug, row.id);
  }

  const systemUserId = await ensureSystemUser();
  await ensureAdminUser();
  const gameIdBySlug = new Map<string, string>();

  for (const game of GAMES) {
    const slug = slugify(game.name);
    const categoryIds = game.categories
      .map((s) => categoryMap.get(s))
      .filter((id): id is string => Boolean(id));

    const jogo = Jogo.create({
      name: game.name,
      slug,
      categoryIds,
      supportedModes: [GameMode.ONLINE],
    });

    const data = JogoMapper.toPersistence(jogo);
    const row = await prisma.jogo.upsert({
      where: { slug: data.slug },
      create: data,
      update: { name: data.name, active: true },
    });

    gameIdBySlug.set(slug, row.id);

    await prisma.jogoModo.deleteMany({ where: { jogoId: row.id } });
    await prisma.jogoModo.createMany({
      data: [{ jogoId: row.id, mode: GameMode.ONLINE }],
    });

    await prisma.jogoCategoria.deleteMany({ where: { jogoId: row.id } });
    if (categoryIds.length > 0) {
      await prisma.jogoCategoria.createMany({
        data: categoryIds.map((categoriaId) => ({ jogoId: row.id, categoriaId })),
      });
    }

    await ensureFixedLobby(row.id, game.name, systemUserId);
  }

  console.log('Seed concluído:', {
    categorias: CATEGORIES.length,
    jogos: GAMES.length,
    salasFixas: gameIdBySlug.size,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
