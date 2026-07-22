import type { JogadorRepository } from '../ports/jogador.repository.js';
import { Username } from '../../domain/value-objects/username.vo.js';

export async function resolveUniqueUsername(
  repo: JogadorRepository,
  base: string,
): Promise<string> {
  let normalized = Username.normalize(base);
  if (normalized.length < 3) {
    normalized = `user${normalized}`.slice(0, 20);
  }

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : `_${attempt}`;
    const candidateRaw = `${normalized.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
    const candidate = Username.create(candidateRaw);
    const existing = await repo.findByUsername(candidate);
    if (!existing) {
      return candidate.toString();
    }
  }

  return Username.create(`user_${Date.now().toString(36).slice(-6)}`).toString();
}
