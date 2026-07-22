import { NotFoundError, ConflictError } from '@shared/application/application.error.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { DisplayName } from '../../domain/value-objects/display-name.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';

export interface AtualizarPerfilInput {
  playerId: string;
  displayName: string;
}

export interface AtualizarPerfilOutput {
  playerId: string;
  displayName: string;
}

export class AtualizarPerfilUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: AtualizarPerfilInput): Promise<AtualizarPerfilOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    const displayName = DisplayName.create(input.displayName.trim());
    const existing = await this.jogadorRepo.findByDisplayName(displayName, jogador.id);
    if (existing) {
      throw new ConflictError('Nome de exibição já está em uso');
    }

    jogador.atualizarDisplayName(input.displayName);
    await this.jogadorRepo.save(jogador);

    return {
      playerId: jogador.id.toString(),
      displayName: jogador.displayName.toString(),
    };
  }
}
