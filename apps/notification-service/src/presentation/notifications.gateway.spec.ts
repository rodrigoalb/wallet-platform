import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { io, Socket } from 'socket.io-client';
import { PlayerTokenService } from '../auth/player-token.service';
import { loadNotificationConfig, NOTIFICATION_CONFIG } from '../config';
import { NotificationsGateway } from './notifications.gateway';

/**
 * Teste de integração do gateway com um servidor socket.io real em porta
 * aleatória e clientes socket.io de verdade (sem SQS).
 */
describe('NotificationsGateway', () => {
  let app: INestApplication;
  let gateway: NotificationsGateway;
  let tokens: PlayerTokenService;
  let url: string;
  const sockets: Socket[] = [];

  const connect = (token?: string): Socket => {
    const socket = io(url, { auth: token ? { token } : {}, transports: ['websocket'] });
    sockets.push(socket);
    return socket;
  };
  const waitFor = <T>(socket: Socket, event: string): Promise<T> =>
    new Promise((resolve) => socket.once(event, resolve));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: NOTIFICATION_CONFIG, useValue: { ...loadNotificationConfig(), jwtSecret: 's' } },
        PlayerTokenService,
        NotificationsGateway,
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    const { port } = (app.getHttpServer() as HttpServer).address() as AddressInfo;
    url = `http://localhost:${port}`;
    gateway = app.get(NotificationsGateway);
    tokens = app.get(PlayerTokenService);
  });

  afterEach(() => {
    sockets.splice(0).forEach((s) => s.disconnect());
  });

  afterAll(async () => {
    await app.close();
  });

  it('recusa conexão sem token ou com token inválido', async () => {
    const noToken = await waitFor<Error>(connect(), 'connect_error');
    expect(noToken.message).toBe('Token ausente');

    const badToken = await waitFor<Error>(connect('abc'), 'connect_error');
    expect(badToken.message).toBe('Token inválido ou expirado');
  });

  it('entrega o evento só ao jogador dono da sala', async () => {
    const ana = connect(tokens.issue('ana').token);
    const bia = connect(tokens.issue('bia').token);
    await Promise.all([waitFor(ana, 'connect'), waitFor(bia, 'connect')]);
    // Garante que o servidor já colocou os sockets nas salas.
    await new Promise((r) => setTimeout(r, 50));

    const biaReceived = jest.fn();
    bia.on('balance.updated', biaReceived);
    const anaMessage = waitFor(ana, 'balance.updated');

    gateway.notifyPlayer('ana', 'balance.updated', { balance: 100 });

    await expect(anaMessage).resolves.toEqual({ balance: 100 });
    await new Promise((r) => setTimeout(r, 50));
    expect(biaReceived).not.toHaveBeenCalled();
  });
});
