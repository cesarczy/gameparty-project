import type { Mensagem as PrismaMensagem } from '@prisma/client';
import { Mensagem } from '../../domain/mensagem/mensagem.aggregate.js';
import { MessageContent } from '../../domain/value-objects/message-content.vo.js';
import { MensagemId } from '../../domain/value-objects/mensagem-id.vo.js';

export class MensagemMapper {
  static toDomain(row: PrismaMensagem): Mensagem {
    return Mensagem.reconstitute({
      id: MensagemId.create(row.id),
      roomId: row.salaId,
      authorId: row.authorId,
      content: MessageContent.create(row.content),
      sentAt: row.sentAt,
    });
  }

  static toPersistence(mensagem: Mensagem) {
    return {
      id: mensagem.id.toString(),
      salaId: mensagem.roomId,
      authorId: mensagem.authorId,
      content: mensagem.content.toString(),
      sentAt: mensagem.sentAt,
    };
  }
}
