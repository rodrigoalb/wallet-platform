/**
 * Contrato dos eventos trocados entre os serviços. Fica na lib compartilhada
 * para que produtor (wallet-service) e consumidores usem exatamente os mesmos tipos.
 */
export const EventTypes = {
  TransactionCreated: 'transaction.created',
  BalanceUpdated: 'wallet.balance-updated',
  StatementRequested: 'statement.requested',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export interface TransactionCreatedPayload {
  transactionId: string;
  walletId: string;
  playerId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amountCents: number;
  balanceAfterCents: number;
  currency: string;
  createdAt: string;
}

export interface BalanceUpdatedPayload {
  walletId: string;
  playerId: string;
  balanceCents: number;
  currency: string;
  /** Lançamento que causou a mudança, útil para o cliente ordenar notificações. */
  transactionId: string;
}

export interface StatementRequestedPayload {
  statementId: string;
  walletId: string;
  from: string;
  to: string;
}

interface PayloadByType {
  'transaction.created': TransactionCreatedPayload;
  'wallet.balance-updated': BalanceUpdatedPayload;
  'statement.requested': StatementRequestedPayload;
}

/** Fato de domínio, ainda sem metadados de transporte. */
export type DomainEvent = {
  [T in EventType]: { type: T; payload: PayloadByType[T] };
}[EventType];

/** Envelope publicado no SNS: o fato de domínio mais metadados de rastreio. */
export type EventEnvelope = DomainEvent & {
  /** Identificador único, usado pelos consumidores para ignorar duplicatas. */
  eventId: string;
  occurredAt: string;
  correlationId: string;
};
