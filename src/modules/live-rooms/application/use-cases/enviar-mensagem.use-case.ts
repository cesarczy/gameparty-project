import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '@identity/application/ports/jogador.repository.js';
import { JogadorId } from '@identity/domain/value-objects/jogador-id.vo.js';
import { Mensagem } from '../../domain/mensagem/mensagem.aggregate.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import type { MensagemRepository } from '../ports/sala.repository.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface EnviarMensagemInput {
  roomId: string;
  authorId: string;
  content: string;
}

export interface EnviarMensagemOutput {
  messageId: string;
  roomId: string;
  authorId: string;
  authorDisplayName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  content: string;
  sentAt: string;
}

export class EnviarMensagemUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly mensagemRepo: MensagemRepository,
    private readonly jogadorRepo: JogadorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: EnviarMensagemInput): Promise<EnviarMensagemOutput> {
    const sala = await this.salaRepo.findById(SalaId.create(input.roomId));
    if (!sala) {
      throw new NotFoundError('Sala', input.roomId);
    }

    if (!sala.temParticipante(input.authorId)) {
      throw new ForbiddenError('Apenas participantes podem enviar mensagens');
    }

    const autor = await this.jogadorRepo.findById(JogadorId.create(input.authorId));
    if (!autor) {
      throw new NotFoundError('Jogador', input.authorId);
    }

    autor.registrarAtividade();
    await this.jogadorRepo.save(autor);

    const mensagem = Mensagem.create({
      roomId: input.roomId,
      authorId: input.authorId,
      content: input.content,
    });

    await this.mensagemRepo.save(mensagem);
    await this.eventBus.publishAll(mensagem.pullDomainEvents());

    return {
      messageId: mensagem.id.toString(),
      roomId: mensagem.roomId,
      authorId: mensagem.authorId,
      authorDisplayName: autor.displayName.toString(),
      authorRole: autor.role,
      authorAvatarUrl: autor.avatarUrl,
      content: mensagem.content.toString(),
      sentAt: mensagem.sentAt.toISOString(),
    };
  }
}
