import type { DomainEvent } from '@shared/domain/domain-event.js';
import { Capacity } from '../value-objects/capacity.vo.js';
import { ModoSalaVo } from '../value-objects/modo-sala.vo.js';
import { RoomStatus } from '../value-objects/room-status.vo.js';
import { RoomTitle } from '../value-objects/room-title.vo.js';
import { SalaId } from '../value-objects/sala-id.vo.js';
import { Participante } from './participante.entity.js';
import {
  CriadorInvalidoError,
  ParticipanteNaoEncontradoError,
  SalaCheiaError,
  SalaEncerradaError,
} from '../errors/sala.errors.js';
import { SalaFixaNaoEncerravelError } from '../errors/sala-fixa.errors.js';
import {
  JogadorEntrouNaSalaEvent,
  JogadorSaiuDaSalaEvent,
  SalaCriadaEvent,
  SalaEncerradaEvent,
} from '../events/sala.events.js';

export interface SalaProps {
  id: SalaId;
  gameId: string;
  creatorId: string;
  title: RoomTitle;
  mode: ModoSalaVo;
  capacity: Capacity;
  isFixed: boolean;
  status: RoomStatus;
  participantes: Participante[];
  createdAt: Date;
}

export class Sala {
  private readonly domainEvents: DomainEvent[] = [];

  private constructor(private props: SalaProps) {}

  static create(input: {
    gameId: string;
    creatorId: string;
    title: string;
    mode: string;
    capacity: number;
  }): Sala {
    const sala = new Sala({
      id: SalaId.create(),
      gameId: input.gameId,
      creatorId: input.creatorId,
      title: RoomTitle.create(input.title),
      mode: ModoSalaVo.create(input.mode),
      capacity: Capacity.create(input.capacity),
      isFixed: false,
      status: RoomStatus.ABERTA,
      participantes: [Participante.create(input.creatorId)],
      createdAt: new Date(),
    });

    sala.record(
      SalaCriadaEvent.create(sala.props.id, {
        gameId: sala.props.gameId,
        creatorId: sala.props.creatorId,
        title: sala.props.title.toString(),
        mode: sala.props.mode.toString(),
      }),
    );

    return sala;
  }

  static reconstitute(props: SalaProps): Sala {
    return new Sala(props);
  }

  get id(): SalaId {
    return this.props.id;
  }

  get gameId(): string {
    return this.props.gameId;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get title(): RoomTitle {
    return this.props.title;
  }

  get mode(): ModoSalaVo {
    return this.props.mode;
  }

  get capacity(): Capacity {
    return this.props.capacity;
  }

  get isFixed(): boolean {
    return this.props.isFixed;
  }

  get status(): RoomStatus {
    return this.props.status;
  }

  get participantes(): readonly Participante[] {
    return [...this.props.participantes];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  entrar(jogadorId: string): void {
    this.assertAberta();
    if (this.temParticipante(jogadorId)) {
      return;
    }
    if (this.props.participantes.length >= this.props.capacity.toNumber()) {
      throw new SalaCheiaError();
    }

    this.props.participantes.push(Participante.create(jogadorId));
    this.atualizarStatusPorOcupacao();
    this.record(JogadorEntrouNaSalaEvent.create(this.props.id, jogadorId));
  }

  sair(jogadorId: string): void {
    this.assertAberta();
    const index = this.props.participantes.findIndex(
      (p) => p.jogadorId === jogadorId,
    );
    if (index === -1) {
      throw new ParticipanteNaoEncontradoError(jogadorId);
    }

    this.props.participantes.splice(index, 1);
    this.atualizarStatusPorOcupacao();
    this.record(JogadorSaiuDaSalaEvent.create(this.props.id, jogadorId));
  }

  encerrar(requesterId: string): void {
    if (this.props.isFixed) {
      throw new SalaFixaNaoEncerravelError();
    }
    if (requesterId !== this.props.creatorId) {
      throw new CriadorInvalidoError();
    }
    this.assertAberta();
    this.props.status = RoomStatus.ENCERRADA;
    this.record(SalaEncerradaEvent.create(this.props.id));
  }

  temParticipante(jogadorId: string): boolean {
    return this.props.participantes.some((p) => p.jogadorId === jogadorId);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private assertAberta(): void {
    if (this.props.status === RoomStatus.ENCERRADA) {
      throw new SalaEncerradaError();
    }
  }

  private atualizarStatusPorOcupacao(): void {
    if (this.props.status === RoomStatus.ENCERRADA) {
      return;
    }
    this.props.status =
      this.props.participantes.length >= this.props.capacity.toNumber()
        ? RoomStatus.CHEIA
        : RoomStatus.ABERTA;
  }

  private record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
