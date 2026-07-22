import type {
  Sala as PrismaSala,
  SalaParticipante,
} from '@prisma/client';
import { Sala } from '../../domain/sala/sala.aggregate.js';
import { Capacity } from '../../domain/value-objects/capacity.vo.js';
import { ModoSalaVo } from '../../domain/value-objects/modo-sala.vo.js';
import { RoomStatus } from '../../domain/value-objects/room-status.vo.js';
import { RoomTitle } from '../../domain/value-objects/room-title.vo.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import { Participante } from '../../domain/sala/participante.entity.js';

type SalaWithParticipantes = PrismaSala & { participantes: SalaParticipante[] };

export class SalaMapper {
  static toDomain(row: SalaWithParticipantes): Sala {
    return Sala.reconstitute({
      id: SalaId.create(row.id),
      gameId: row.jogoId,
      creatorId: row.creatorId,
      title: RoomTitle.create(row.title),
      mode: ModoSalaVo.create(row.mode),
      capacity: Capacity.create(row.capacity),
      isFixed: row.isFixed,
      status: row.status as RoomStatus,
      participantes: row.participantes.map((p) =>
        Participante.reconstitute(p.jogadorId, p.joinedAt),
      ),
      createdAt: row.createdAt,
    });
  }

  static toPersistence(sala: Sala) {
    return {
      id: sala.id.toString(),
      jogoId: sala.gameId,
      creatorId: sala.creatorId,
      title: sala.title.toString(),
      mode: sala.mode.toString(),
      capacity: sala.capacity.toNumber(),
      isFixed: sala.isFixed,
      status: sala.status,
      createdAt: sala.createdAt,
    };
  }
}
