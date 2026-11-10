import jwt from 'jsonwebtoken';
import { loadNotificationConfig } from '../config';
import { PlayerTokenService } from './player-token.service';

describe('PlayerTokenService', () => {
  const config = { ...loadNotificationConfig(), jwtSecret: 'segredo-de-teste' };
  const service = new PlayerTokenService(config);

  it('emite um token que identifica o jogador', () => {
    const { token } = service.issue('player-1');
    expect(service.verify(token)).toBe('player-1');
  });

  it('recusa token assinado com outro segredo', () => {
    const forged = jwt.sign({}, 'outro-segredo', {
      subject: 'player-1',
      issuer: 'wallet-platform',
    });
    expect(() => service.verify(forged)).toThrow();
  });

  it('recusa token expirado', () => {
    const expired = jwt.sign({}, 'segredo-de-teste', {
      subject: 'player-1',
      issuer: 'wallet-platform',
      expiresIn: -10,
    });
    expect(() => service.verify(expired)).toThrow('jwt expired');
  });
});
