import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../application/ports/password-hasher.port.js';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, 10);
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
