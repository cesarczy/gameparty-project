import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AvatarArquivoInvalidoError } from '../../domain/errors/perfil.errors.js';
import type { AvatarFileInput, AvatarStorage } from '../../application/ports/avatar-storage.port.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 2 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export class LocalAvatarStorage implements AvatarStorage {
  constructor(private readonly rootDir: string) {}

  async save(playerId: string, file: AvatarFileInput): Promise<string> {
    if (!ALLOWED.has(file.mimetype)) {
      throw new AvatarArquivoInvalidoError('Formato inválido. Use JPG, PNG, WEBP ou GIF.');
    }
    if (file.buffer.byteLength > MAX_BYTES) {
      throw new AvatarArquivoInvalidoError('Arquivo muito grande. Máximo 2 MB.');
    }

    const dir = path.join(this.rootDir, 'avatars');
    await mkdir(dir, { recursive: true });

    const ext = EXT[file.mimetype] ?? '.jpg';
    const filename = `${playerId}${ext}`;
    await writeFile(path.join(dir, filename), file.buffer);

    return `/uploads/avatars/${filename}`;
  }
}
