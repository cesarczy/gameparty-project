import { DomainError } from '@shared/domain/domain.error.js';
import type { DomainEvent } from '@shared/domain/domain-event.js';
import { assertValidGameModes } from '../errors/jogo.errors.js';
import { GameMode } from '../value-objects/game-mode.vo.js';
import { JogoId } from '../value-objects/jogo-id.vo.js';
import { Slug } from '../value-objects/slug.vo.js';
import { JogoCadastradoEvent } from '../events/jogo-cadastrado.event.js';

export interface JogoProps {
  id: JogoId;
  name: string;
  slug: Slug;
  coverUrl: string | null;
  categoryIds: string[];
  supportedModes: GameMode[];
  active: boolean;
}

export class Jogo {
  private readonly domainEvents: DomainEvent[] = [];

  private constructor(private props: JogoProps) {
    if (!props.name.trim()) {
      throw new DomainError('Nome do jogo é obrigatório');
    }
    assertValidGameModes(props.supportedModes);
  }

  static create(input: {
    name: string;
    slug: string;
    categoryIds: string[];
    supportedModes: GameMode[];
  }): Jogo {
    const jogo = new Jogo({
      id: JogoId.create(),
      name: input.name.trim(),
      slug: Slug.create(input.slug),
      coverUrl: null,
      categoryIds: [...new Set(input.categoryIds)],
      supportedModes: [...input.supportedModes],
      active: true,
    });

    jogo.record(
      JogoCadastradoEvent.create(
        jogo.props.id,
        jogo.props.slug.toString(),
        jogo.props.name,
      ),
    );

    return jogo;
  }

  static reconstitute(props: JogoProps): Jogo {
    return new Jogo(props);
  }

  get id(): JogoId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get coverUrl(): string | null {
    return this.props.coverUrl;
  }

  get categoryIds(): readonly string[] {
    return [...this.props.categoryIds];
  }

  get supportedModes(): readonly GameMode[] {
    return [...this.props.supportedModes];
  }

  get active(): boolean {
    return this.props.active;
  }

  suportaModo(mode: GameMode): boolean {
    return this.props.supportedModes.includes(mode);
  }

  desativar(): void {
    this.props.active = false;
  }

  ativar(): void {
    this.props.active = true;
  }

  atualizarIdentidade(input: { name: string; slug: string }): void {
    const name = input.name.trim();
    if (!name) {
      throw new DomainError('Nome do jogo é obrigatório');
    }
    this.props.name = name;
    this.props.slug = Slug.create(input.slug);
  }

  definirCoverUrl(url: string | null): void {
    this.props.coverUrl = url;
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
