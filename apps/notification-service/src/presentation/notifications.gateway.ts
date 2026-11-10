import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayerNotifier } from '../application/player-notifier';
import { PlayerTokenService } from '../auth/player-token.service';

interface SocketData {
  playerId: string;
}

/** Cada jogador tem uma sala própria; só os sockets dele entram nela. */
export function playerRoom(playerId: string): string {
  return `player:${playerId}`;
}

/**
 * Gateway socket.io (o equivalente Nest a um endpoint WebSocket/STOMP do Spring).
 * Fluxo: o cliente conecta enviando { auth: { token } }; o middleware valida o
 * JWT antes de aceitar a conexão; o socket entra na sala do jogador; eventos
 * são emitidos para a sala, então chegam a todas as abas abertas daquele
 * jogador e a nenhum outro.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, PlayerNotifier {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly tokens: PlayerTokenService) {}

  afterInit(server: Server): void {
    // Middleware do handshake: conexão sem token válido é recusada antes de existir.
    server.use((socket: Socket, next) => {
      const token: unknown = socket.handshake.auth?.token;
      if (typeof token !== 'string' || token === '') {
        return next(new Error('Token ausente'));
      }
      try {
        (socket.data as SocketData).playerId = this.tokens.verify(token);
        next();
      } catch {
        next(new Error('Token inválido ou expirado'));
      }
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const { playerId } = socket.data as SocketData;
    await socket.join(playerRoom(playerId));
    this.logger.log(`Jogador ${playerId} conectado (socket ${socket.id})`);
  }

  notifyPlayer(playerId: string, event: string, data: unknown): void {
    this.server.to(playerRoom(playerId)).emit(event, data);
    this.logger.log(`Notificação ${event} enviada ao jogador ${playerId}`);
  }
}
