import type { PrismaClient } from '@prisma/client';
import type { JogadorRepository } from '../../application/ports/jogador.repository.js';
import type { Email } from '../../domain/value-objects/email.vo.js';
import type { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { JogadorMapper } from './jogador.mapper.js';

export class PrismaJogadorRepository implements JogadorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(jogador: Jogador): Promise<void> {
    const data = JogadorMapper.toPersistence(jogador);
    await this.prisma.jogador.upsert({
      where: { id: data.id },
      create: data,
      update: {
        username: data.username,
        email: data.email,
        displayName: data.displayName,
        senhaHash: data.senhaHash,
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
        role: data.role,
      displayNameChangedAt: data.displayNameChangedAt,
      emailChangedAt: data.emailChangedAt,
      profanityFilterEnabled: data.profanityFilterEnabled,
      chatOnline: data.chatOnline,
      theme: data.theme,
      language: data.language,
      country: data.country,
      birthDate: data.birthDate,
      termsAcceptedAt: data.termsAcceptedAt,
      emailVerified: data.emailVerified,
        emailVerificationToken: data.emailVerificationToken,
        passwordResetToken: data.passwordResetToken,
        passwordResetExpiresAt: data.passwordResetExpiresAt,
        bannedAt: data.bannedAt,
        rankId: data.rankId,
        fullName: data.fullName,
        lastSeenAt: data.lastSeenAt,
      },
    });

    await this.prisma.jogadorFavorito.deleteMany({ where: { jogadorId: data.id } });
    if (jogador.favoritos.length > 0) {
      await this.prisma.jogadorFavorito.createMany({
        data: jogador.favoritos.map((jogoId) => ({
          jogadorId: data.id,
          jogoId,
        })),
      });
    }
  }

  async findById(id: JogadorId): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findUnique({
      where: { id: id.toString() },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findUnique({
      where: { email: email.toString() },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByUsername(username: import('../../domain/value-objects/username.vo.js').Username): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findUnique({
      where: { username: username.toString() },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByDisplayName(
    displayName: import('../../domain/value-objects/display-name.vo.js').DisplayName,
    excludeId?: JogadorId,
  ): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findFirst({
      where: {
        displayName: {
          equals: displayName.toString(),
          mode: 'insensitive',
        },
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByEmailVerificationToken(token: string): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findFirst({
      where: { emailVerificationToken: token },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByPasswordResetToken(token: string): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findFirst({
      where: { passwordResetToken: token },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<Jogador | null> {
    const row = await this.prisma.jogador.findUnique({
      where: { googleId },
      include: { favoritos: true },
    });
    return row ? JogadorMapper.toDomain(row) : null;
  }

  async listAll(): Promise<Jogador[]> {
    const rows = await this.prisma.jogador.findMany({
      include: { favoritos: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(JogadorMapper.toDomain);
  }

  async search(query: string, limit = 8): Promise<Jogador[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const rows = await this.prisma.jogador.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { favoritos: true },
      orderBy: { displayName: 'asc' },
      take: limit,
    });
    return rows.map(JogadorMapper.toDomain);
  }

  async delete(id: JogadorId): Promise<void> {
    const systemUser = await this.prisma.jogador.findUnique({
      where: { email: 'system@gameparty.com.br' },
    });

    if (systemUser) {
      await this.prisma.sala.updateMany({
        where: { creatorId: id.toString() },
        data: { creatorId: systemUser.id },
      });
    }

    await this.prisma.jogador.delete({ where: { id: id.toString() } });
  }
}
