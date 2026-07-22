import type { Jogador as PrismaJogador, JogadorFavorito, PlayerRole } from '@prisma/client';
import { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { DisplayName } from '../../domain/value-objects/display-name.vo.js';
import { FullName } from '../../domain/value-objects/full-name.vo.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { Username } from '../../domain/value-objects/username.vo.js';
import { PlayerRole as DomainRole } from '../../domain/value-objects/player-role.vo.js';
import { SenhaHash } from '../../domain/value-objects/senha-hash.vo.js';

type JogadorWithFavoritos = PrismaJogador & { favoritos: JogadorFavorito[] };

export class JogadorMapper {
  static toDomain(row: JogadorWithFavoritos): Jogador {
    return Jogador.reconstitute({
      id: JogadorId.create(row.id),
      username: Username.create(row.username),
      email: Email.create(row.email),
      fullName: FullName.create(row.fullName ?? row.displayName),
      displayName: DisplayName.create(row.displayName),
      senhaHash: row.senhaHash ? SenhaHash.fromHash(row.senhaHash) : null,
      googleId: row.googleId,
      avatarUrl: row.avatarUrl,
      role: row.role as DomainRole,
      displayNameChangedAt: row.displayNameChangedAt,
      emailChangedAt: row.emailChangedAt,
      profanityFilterEnabled: row.profanityFilterEnabled,
      chatOnline: row.chatOnline,
      theme: row.theme,
      language: row.language,
      country: row.country,
      birthDate: row.birthDate,
      termsAcceptedAt: row.termsAcceptedAt,
      emailVerified: row.emailVerified,
      emailVerificationToken: row.emailVerificationToken,
      passwordResetToken: row.passwordResetToken,
      passwordResetExpiresAt: row.passwordResetExpiresAt,
      bannedAt: row.bannedAt,
      rankId: row.rankId,
      lastSeenAt: row.lastSeenAt,
      favoritos: row.favoritos.map((f) => f.jogoId),
      createdAt: row.createdAt,
    });
  }

  static toPersistence(jogador: Jogador) {
    return {
      id: jogador.id.toString(),
      username: jogador.username.toString(),
      email: jogador.email.toString(),
      displayName: jogador.displayName.toString(),
      fullName: jogador.fullName.toString(),
      senhaHash: jogador.senhaHash?.toString() ?? null,
      googleId: jogador.googleId,
      avatarUrl: jogador.avatarUrl,
      role: jogador.role as PlayerRole,
      displayNameChangedAt: jogador.displayNameChangedAt,
      emailChangedAt: jogador.emailChangedAt,
      profanityFilterEnabled: jogador.profanityFilterEnabled,
      chatOnline: jogador.chatOnline,
      theme: jogador.theme,
      language: jogador.language,
      country: jogador.country,
      birthDate: jogador.birthDate,
      termsAcceptedAt: jogador.termsAcceptedAt,
      emailVerified: jogador.emailVerified,
      emailVerificationToken: jogador.emailVerificationToken,
      passwordResetToken: jogador.passwordResetToken,
      passwordResetExpiresAt: jogador.passwordResetExpiresAt,
      bannedAt: jogador.bannedAt,
      rankId: jogador.rankId,
      lastSeenAt: jogador.lastSeenAt,
      createdAt: jogador.createdAt,
    };
  }
}
