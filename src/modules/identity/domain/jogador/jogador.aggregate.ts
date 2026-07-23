import type { DomainEvent } from '@shared/domain/domain-event.js';
import { ApplicationError } from '@shared/application/application.error.js';
import { DisplayName } from '../value-objects/display-name.vo.js';
import { FullName } from '../value-objects/full-name.vo.js';
import { Email } from '../value-objects/email.vo.js';
import { JogadorId } from '../value-objects/jogador-id.vo.js';
import { Username } from '../value-objects/username.vo.js';
import { PlayerRole, isAdminRole } from '../value-objects/player-role.vo.js';
import { SenhaHash } from '../value-objects/senha-hash.vo.js';
import { JogadorRegistradoEvent } from '../events/jogador-registrado.event.js';
import {
  FavoritoJaExisteError,
  FavoritoNaoEncontradoError,
} from '../errors/favorito.errors.js';
import {
  AvatarUrlInvalidaError,
  DisplayNameCooldownError,
  EmailCooldownError,
} from '../errors/perfil.errors.js';
import {
  canChangeDisplayName,
  nextDisplayNameChangeAt,
  canChangeEmail,
  nextEmailChangeAt,
} from '../value-objects/profile-change-cooldown.js';

export interface JogadorProps {
  id: JogadorId;
  username: Username;
  email: Email;
  fullName: FullName;
  displayName: DisplayName;
  senhaHash: SenhaHash | null;
  googleId: string | null;
  avatarUrl: string | null;
  role: PlayerRole;
  displayNameChangedAt: Date;
  emailChangedAt: Date;
  profanityFilterEnabled: boolean;
  chatOnline: boolean;
  theme: string;
  language: string;
  country: string | null;
  birthDate: Date | null;
  termsAcceptedAt: Date | null;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  bannedAt: Date | null;
  rankId: string | null;
  lastSeenAt: Date | null;
  favoritos: string[];
  createdAt: Date;
}

export class Jogador {
  private readonly domainEvents: DomainEvent[] = [];

  private constructor(private props: JogadorProps) {}

  static create(input: {
    username: string;
    email: string;
    fullName?: string;
    displayName?: string;
    senha: string;
    birthDate?: Date | null;
    country?: string | null;
    language?: string;
    termsAcceptedAt: Date;
    emailVerificationToken: string;
  }): Jogador {
    const username = Username.create(input.username);
    const displayName = DisplayName.create(input.displayName?.trim() || username.toString());
    const fullName = FullName.create(input.fullName?.trim() || displayName.toString());
    return Jogador.register({
      username,
      email: input.email,
      fullName,
      displayName,
      senhaHash: SenhaHash.fromPlaintext(input.senha),
      birthDate: input.birthDate ?? null,
      country: input.country ?? null,
      language: input.language ?? 'pt-BR',
      termsAcceptedAt: input.termsAcceptedAt,
      emailVerificationToken: input.emailVerificationToken,
    });
  }

  static register(input: {
    username: Username;
    email: string;
    fullName: FullName;
    displayName: DisplayName;
    senhaHash: SenhaHash;
    birthDate?: Date | null;
    country?: string | null;
    language?: string;
    termsAcceptedAt: Date;
    emailVerificationToken: string;
  }): Jogador {
    const jogador = new Jogador({
      id: JogadorId.create(),
      username: input.username,
      email: Email.create(input.email),
      fullName: input.fullName,
      displayName: input.displayName,
      senhaHash: input.senhaHash,
      googleId: null,
      avatarUrl: null,
      role: PlayerRole.PLAYER,
      displayNameChangedAt: new Date(),
      emailChangedAt: new Date(),
      profanityFilterEnabled: true,
      chatOnline: true,
      theme: 'dark',
      language: input.language ?? 'pt-BR',
      country: input.country ?? null,
      birthDate: input.birthDate ?? null,
      termsAcceptedAt: input.termsAcceptedAt,
      emailVerified: false,
      emailVerificationToken: input.emailVerificationToken,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      bannedAt: null,
      rankId: null,
      lastSeenAt: null,
      favoritos: [],
      createdAt: new Date(),
    });

    jogador.record(
      JogadorRegistradoEvent.create(jogador.props.id, jogador.props.displayName.toString()),
    );

    return jogador;
  }

  static fromGoogle(input: {
    username: string;
    email: string;
    displayName: string;
    googleId: string;
    avatarUrl?: string | null;
  }): Jogador {
    const jogador = new Jogador({
      id: JogadorId.create(),
      username: Username.create(input.username),
      email: Email.create(input.email),
      fullName: FullName.create(input.displayName),
      displayName: DisplayName.create(input.displayName),
      senhaHash: null,
      googleId: input.googleId,
      avatarUrl: input.avatarUrl ?? null,
      role: PlayerRole.PLAYER,
      displayNameChangedAt: new Date(),
      emailChangedAt: new Date(),
      profanityFilterEnabled: true,
      chatOnline: true,
      theme: 'dark',
      language: 'pt-BR',
      country: null,
      birthDate: null,
      termsAcceptedAt: new Date(),
      emailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      bannedAt: null,
      rankId: null,
      lastSeenAt: null,
      favoritos: [],
      createdAt: new Date(),
    });

    jogador.record(
      JogadorRegistradoEvent.create(jogador.props.id, jogador.props.displayName.toString()),
    );

    return jogador;
  }

  static reconstitute(props: JogadorProps): Jogador {
    return new Jogador(props);
  }

  get id(): JogadorId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get username(): Username {
    return this.props.username;
  }

  get displayName(): DisplayName {
    return this.props.displayName;
  }

  get fullName(): FullName {
    return this.props.fullName;
  }

  get senhaHash(): SenhaHash | null {
    return this.props.senhaHash;
  }

  get googleId(): string | null {
    return this.props.googleId;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get role(): PlayerRole {
    return this.props.role;
  }

  get displayNameChangedAt(): Date {
    return this.props.displayNameChangedAt;
  }

  get emailChangedAt(): Date {
    return this.props.emailChangedAt;
  }

  get favoritos(): readonly string[] {
    return [...this.props.favoritos];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get profanityFilterEnabled(): boolean {
    return this.props.profanityFilterEnabled;
  }

  get chatOnline(): boolean {
    return this.props.chatOnline;
  }

  get theme(): string {
    return this.props.theme;
  }

  get language(): string {
    return this.props.language;
  }

  get country(): string | null {
    return this.props.country;
  }

  get birthDate(): Date | null {
    return this.props.birthDate;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get emailVerificationToken(): string | null {
    return this.props.emailVerificationToken;
  }

  get passwordResetToken(): string | null {
    return this.props.passwordResetToken;
  }

  get passwordResetExpiresAt(): Date | null {
    return this.props.passwordResetExpiresAt;
  }

  get lastSeenAt(): Date | null {
    return this.props.lastSeenAt;
  }

  get bannedAt(): Date | null {
    return this.props.bannedAt;
  }

  get rankId(): string | null {
    return this.props.rankId;
  }

  estaBanido(): boolean {
    return this.props.bannedAt !== null;
  }

  ban(now: Date = new Date()): void {
    this.props.bannedAt = now;
    this.props.chatOnline = false;
  }

  desbanir(): void {
    this.props.bannedAt = null;
  }

  atualizarPorAdmin(input: {
    username?: string;
    email?: string;
    displayName?: string;
    role?: PlayerRole;
    country?: string | null;
    birthDate?: Date | null;
    language?: string;
    emailVerified?: boolean;
    chatOnline?: boolean;
    rankId?: string | null;
  }): void {
    if (input.username !== undefined) {
      this.props.username = Username.create(input.username);
    }
    if (input.email !== undefined) {
      this.props.email = Email.create(input.email);
    }
    if (input.displayName !== undefined) {
      this.props.displayName = DisplayName.create(input.displayName);
      this.props.displayNameChangedAt = new Date();
    }
    if (input.role !== undefined) {
      this.props.role = input.role;
    }
    if (input.country !== undefined) {
      this.props.country = input.country;
    }
    if (input.birthDate !== undefined) {
      this.props.birthDate = input.birthDate;
    }
    if (input.language !== undefined) {
      this.props.language = input.language;
    }
    if (input.emailVerified !== undefined) {
      this.props.emailVerified = input.emailVerified;
      if (input.emailVerified) {
        this.props.emailVerificationToken = null;
      }
    }
    if (input.chatOnline !== undefined) {
      this.props.chatOnline = input.chatOnline;
    }
    if (input.rankId !== undefined) {
      this.props.rankId = input.rankId;
    }
  }

  atualizarConfiguracoes(input: {
    profanityFilterEnabled?: boolean;
    chatOnline?: boolean;
    theme?: string;
    language?: string;
  }): void {
    if (input.profanityFilterEnabled !== undefined) {
      this.props.profanityFilterEnabled = input.profanityFilterEnabled;
    }
    if (input.chatOnline !== undefined) {
      this.props.chatOnline = input.chatOnline;
    }
    if (input.theme !== undefined) {
      this.props.theme = input.theme;
    }
    if (input.language !== undefined) {
      this.props.language = input.language;
    }
  }

  registrarAtividade(now: Date = new Date()): void {
    this.props.lastSeenAt = now;
  }

  touchPresence(now: Date = new Date()): boolean {
    if (this.props.lastSeenAt) {
      const diffMs = now.getTime() - this.props.lastSeenAt.getTime();
      if (diffMs < 60 * 1000) return false;
    }
    this.props.lastSeenAt = now;
    return true;
  }

  estaOnlineParaChat(now: Date = new Date()): boolean {
    if (this.estaBanido()) return false;
    if (!this.props.chatOnline) return false;
    if (!this.props.lastSeenAt) return false;
    const diffMs = now.getTime() - this.props.lastSeenAt.getTime();
    return diffMs < 5 * 60 * 1000;
  }

  marcarAusente(): void {
    this.props.lastSeenAt = new Date(0);
  }

  vincularGoogle(googleId: string, avatarUrl?: string | null): void {
    this.props.googleId = googleId;
    if (avatarUrl) {
      this.props.avatarUrl = avatarUrl;
    }
  }

  atualizarDisplayName(raw: string, now: Date = new Date()): void {
    if (!this.isentoCooldownPerfil() && !canChangeDisplayName(this.props.displayNameChangedAt, now)) {
      throw new DisplayNameCooldownError(nextDisplayNameChangeAt(this.props.displayNameChangedAt));
    }
    const next = DisplayName.create(raw);
    if (next.equals(this.props.displayName)) {
      return;
    }
    this.props.displayName = next;
    this.props.displayNameChangedAt = now;
  }

  podeAlterarDisplayName(now: Date = new Date()): boolean {
    if (this.isentoCooldownPerfil()) return true;
    return canChangeDisplayName(this.props.displayNameChangedAt, now);
  }

  proximaAlteracaoDisplayName(): Date {
    return nextDisplayNameChangeAt(this.props.displayNameChangedAt);
  }

  atualizarEmail(raw: string, now: Date = new Date()): void {
    if (!this.isentoCooldownPerfil() && !canChangeEmail(this.props.emailChangedAt, now)) {
      throw new EmailCooldownError(nextEmailChangeAt(this.props.emailChangedAt));
    }
    const next = Email.create(raw);
    if (next.equals(this.props.email)) {
      return;
    }
    this.props.email = next;
    this.props.emailChangedAt = now;
  }

  podeAlterarEmail(now: Date = new Date()): boolean {
    if (this.isentoCooldownPerfil()) return true;
    return canChangeEmail(this.props.emailChangedAt, now);
  }

  proximaAlteracaoEmail(): Date {
    return nextEmailChangeAt(this.props.emailChangedAt);
  }

  private isentoCooldownPerfil(): boolean {
    return isAdminRole(this.props.role);
  }

  definirSenhaHash(hash: SenhaHash): void {
    this.props.senhaHash = hash;
  }

  solicitarRecuperacaoSenha(token: string, expiresAt: Date): void {
    if (!this.props.senhaHash) {
      throw new ApplicationError('Esta conta não utiliza senha local.');
    }
    this.props.passwordResetToken = token;
    this.props.passwordResetExpiresAt = expiresAt;
  }

  tokenRecuperacaoValido(token: string, now: Date = new Date()): boolean {
    if (!this.props.passwordResetToken || this.props.passwordResetToken !== token) return false;
    if (!this.props.passwordResetExpiresAt || this.props.passwordResetExpiresAt.getTime() <= now.getTime()) {
      return false;
    }
    return true;
  }

  concluirRecuperacaoSenha(token: string, hash: SenhaHash, now: Date = new Date()): void {
    if (!this.tokenRecuperacaoValido(token, now)) {
      throw new ApplicationError('Link de recuperação inválido ou expirado.');
    }
    this.props.senhaHash = hash;
    this.props.passwordResetToken = null;
    this.props.passwordResetExpiresAt = null;
  }

  atualizarAvatar(url: string | null): void {
    if (url === null || url === '') {
      this.props.avatarUrl = null;
      return;
    }
    if (url.startsWith('/uploads/avatars/')) {
      this.props.avatarUrl = url;
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new AvatarUrlInvalidaError();
      }
      this.props.avatarUrl = url;
    } catch (error) {
      if (error instanceof AvatarUrlInvalidaError) throw error;
      throw new AvatarUrlInvalidaError();
    }
  }

  definirRole(role: PlayerRole): void {
    this.props.role = role;
  }

  confirmarEmail(): void {
    this.props.emailVerified = true;
    this.props.emailVerificationToken = null;
  }

  exigeSenhaLocal(): boolean {
    return this.props.senhaHash !== null;
  }

  adicionarFavorito(gameId: string): void {
    if (this.props.favoritos.includes(gameId)) {
      throw new FavoritoJaExisteError(gameId);
    }
    this.props.favoritos.push(gameId);
  }

  removerFavorito(gameId: string): void {
    const index = this.props.favoritos.indexOf(gameId);
    if (index === -1) {
      throw new FavoritoNaoEncontradoError(gameId);
    }
    this.props.favoritos.splice(index, 1);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
