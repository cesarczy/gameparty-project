import type { MensagemRepository } from '../ports/sala.repository.js';

export interface ListarMensagensSalaInput {
  roomId: string;
  limit?: number;
}

export class ListarMensagensSalaUseCase {
  constructor(private readonly mensagemRepo: MensagemRepository) {}

  async execute(input: ListarMensagensSalaInput) {
    const messages = await this.mensagemRepo.listRecentByRoom(input.roomId, input.limit ?? 50);
    return { messages };
  }
}
