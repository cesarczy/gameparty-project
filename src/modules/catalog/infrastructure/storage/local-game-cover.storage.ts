import { ApplicationError } from '@shared/application/application.error.js';
import type { GameCoverFileInput, GameCoverStorage } from '../../application/ports/game-cover-storage.port.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 2 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export class LocalGameCoverStorage implements GameCoverStorage {
  constructor(private readonly rootDir: string) {}

  async save(gameId: string, file: GameCoverFileInput): Promise<string> {
    if (!ALLOWED.has(file.mimetype)) {
      throw new ApplicationError('Formato inválido. Use JPG, PNG, WEBP ou GIF.');
    }
    if (file.buffer.byteLength > MAX_BYTES) {
      throw new ApplicationError('Arquivo muito grande. Máximo 2 MB.');
    }

    const { mkdir, writeFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = path.join(this.rootDir, 'game-covers');
    await mkdir(dir, { recursive: true });

    const ext = EXT[file.mimetype] ?? '.jpg';
    const filename = `${gameId}${ext}`;
    await writeFile(path.join(dir, filename), file.buffer);

    return `/uploads/game-covers/${filename}`;
  }
}
