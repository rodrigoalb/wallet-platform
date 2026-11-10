/** Porta de saída: entregar uma mensagem em tempo real a um jogador específico. */
export interface PlayerNotifier {
  notifyPlayer(playerId: string, event: string, data: unknown): void;
}

export const PLAYER_NOTIFIER = Symbol('PLAYER_NOTIFIER');
