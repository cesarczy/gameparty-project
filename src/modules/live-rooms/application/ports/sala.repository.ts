import type { Mensagem } from '../../domain/mensagem/mensagem.aggregate.js';
import type { Sala } from '../../domain/sala/sala.aggregate.js';
import type { SalaId } from '../../domain/value-objects/sala-id.vo.js';

export interface SalaRepository {
  save(sala: Sala): Promise<void>;
  findById(id: SalaId): Promise<Sala | null>;
  findByGameId(gameId: string): Promise<Sala | null>;
  listActiveByGame(gameId: string): Promise<Sala[]>;
  listActiveByCategory(categoryId: string): Promise<Sala[]>;
  registrarParticipante(salaId: string, jogadorId: string): Promise<void>;
  contarParticipantes(salaId: string): Promise<number>;
}

export interface MensagemRepository {
  save(mensagem: Mensagem): Promise<void>;
  listRecentByRoom(
    roomId: string,
    limit?: number,
  ): Promise<
    Array<{
      messageId: string;
      roomId: string;
      authorId: string;
      authorDisplayName: string;
      authorRole: string;
      authorAvatarUrl: string | null;
      content: string;
      sentAt: string;
    }>
  >;
}
