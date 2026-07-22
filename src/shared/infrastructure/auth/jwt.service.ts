import { SignJWT, jwtVerify } from 'jose';

export interface TokenPayload {
  playerId: string;
  displayName: string;
  role: string;
}

export class JwtService {
  private readonly secret: Uint8Array;

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  async sign(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);
  }

  async verify(token: string): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.secret);
    const playerId = payload.playerId;
    const displayName = payload.displayName;
    const role = payload.role;
    if (typeof playerId !== 'string' || typeof displayName !== 'string') {
      throw new Error('Token inválido');
    }
    return {
      playerId,
      displayName,
      role: typeof role === 'string' ? role : 'PLAYER',
    };
  }
}
