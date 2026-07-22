import { DomainError } from '@shared/domain/domain.error.js';

export enum ModoSala {
  ONLINE = 'ONLINE',
  CAMPANHA = 'CAMPANHA',
}

export class ModoSalaVo {
  private constructor(private readonly value: ModoSala) {}

  static create(raw: string): ModoSalaVo {
    if (!Object.values(ModoSala).includes(raw as ModoSala)) {
      throw new DomainError(`Modo de sala inválido: ${raw}`);
    }
    return new ModoSalaVo(raw as ModoSala);
  }

  toString(): ModoSala {
    return this.value;
  }

  equals(other: ModoSalaVo): boolean {
    return this.value === other.value;
  }
}
