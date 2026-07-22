import { NotFoundError } from '@shared/application/application.error.js';
import type { AvatarStorage } from '../ports/avatar-storage.port.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { AtualizarAvatarUseCase } from './atualizar-avatar.use-case.js';

export interface UploadAvatarInput {
  playerId: string;
  buffer: Buffer;
  mimetype: string;
}

export class UploadAvatarUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly avatarStorage: AvatarStorage,
    private readonly atualizarAvatar: AtualizarAvatarUseCase,
  ) {}

  async execute(input: UploadAvatarInput) {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    const avatarUrl = await this.avatarStorage.save(input.playerId, {
      buffer: input.buffer,
      mimetype: input.mimetype,
    });

    return this.atualizarAvatar.execute({ playerId: input.playerId, avatarUrl });
  }
}
