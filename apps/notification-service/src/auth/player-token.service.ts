import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { NOTIFICATION_CONFIG, NotificationConfig } from '../config';

const ISSUER = 'wallet-platform';
const TOKEN_TTL_SECONDS = 3600;

/**
 * Tokens JWT que identificam o jogador na conexão WebSocket.
 * O campo "sub" (subject) carrega o id do jogador; o segredo HS256 vem do
 * Secrets Manager, então nunca aparece no código nem no Git.
 */
@Injectable()
export class PlayerTokenService {
  constructor(@Inject(NOTIFICATION_CONFIG) private readonly config: NotificationConfig) {}

  issue(playerId: string): { token: string; expiresInSeconds: number } {
    const token = jwt.sign({}, this.config.jwtSecret, {
      algorithm: 'HS256',
      subject: playerId,
      issuer: ISSUER,
      expiresIn: TOKEN_TTL_SECONDS,
    });
    return { token, expiresInSeconds: TOKEN_TTL_SECONDS };
  }

  /** Devolve o id do jogador ou lança erro se o token for inválido ou expirado. */
  verify(token: string): string {
    const payload = jwt.verify(token, this.config.jwtSecret, {
      algorithms: ['HS256'], // fixar o algoritmo evita ataques de troca de algoritmo
      issuer: ISSUER,
    });
    if (typeof payload === 'string' || !payload.sub) {
      throw new Error('Token sem identificação do jogador');
    }
    return payload.sub;
  }
}
