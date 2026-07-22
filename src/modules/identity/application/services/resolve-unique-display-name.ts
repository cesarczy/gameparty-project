import type { JogadorRepository } from '../ports/jogador.repository.js';
import { DisplayName } from '../../domain/value-objects/display-name.vo.js';

export async function resolveUniqueDisplayName(
  repo: JogadorRepository,
  base: string,
): Promise<string> {
  let trimmed = base.trim().slice(0, 32);
  if (trimmed.length < 2) {
    trimmed = 'Jogador';
  }

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : ` ${attempt + 1}`;
    const maxBaseLen = Math.max(2, 32 - suffix.length);
    const candidateRaw = `${trimmed.slice(0, maxBaseLen)}${suffix}`;
    const candidate = DisplayName.create(candidateRaw);
    const existing = await repo.findByDisplayName(candidate);
    if (!existing) {
      return candidate.toString();
    }
  }

  return DisplayName.create(`Jogador ${Date.now().toString(36).slice(-4)}`).toString();
}
