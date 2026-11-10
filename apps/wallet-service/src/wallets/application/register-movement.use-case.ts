import { DomainEvent } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_PUBLISHER, EventPublisher } from '../../shared/application/event-publisher';
import {
  TRANSACTION_MANAGER,
  TransactionManager,
} from '../../shared/application/transaction-manager';
import {
  BusinessRuleError,
  ConcurrencyConflictError,
  NotFoundError,
} from '../../shared/domain/errors';
import { Money } from '../domain/money';
import { Transaction, TransactionType } from '../domain/transaction.entity';
import { TRANSACTION_REPOSITORY, TransactionRepository } from '../domain/transaction.repository';
import { WALLET_REPOSITORY, WalletRepository } from '../domain/wallet.repository';

export interface RegisterMovementCommand {
  walletId: string;
  type: TransactionType;
  amountCents: number;
  idempotencyKey: string;
}

export interface MovementResult {
  transaction: Transaction;
  /** true quando a Idempotency-Key já tinha sido usada e devolvemos o resultado original. */
  replayed: boolean;
}

const MAX_ATTEMPTS = 3;

/**
 * Depósito ou saque. Passos:
 * 1. Se a Idempotency-Key já existe, devolve o lançamento original.
 * 2. Senão, numa única transação de banco: carrega a carteira, aplica a regra
 *    de domínio, grava o novo saldo e o lançamento.
 * 3. Só depois do commit publica os eventos.
 */
@Injectable()
export class RegisterMovementUseCase {
  private readonly logger = new Logger(RegisterMovementUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactions: TransactionRepository,
    @Inject(TRANSACTION_MANAGER) private readonly transactionManager: TransactionManager,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: RegisterMovementCommand): Promise<MovementResult> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.tryOnce(command);
      } catch (error) {
        if (!(error instanceof ConcurrencyConflictError)) throw error;

        // Uma requisição concorrente com a MESMA chave venceu a corrida:
        // devolvemos o resultado dela, como se fosse uma repetição comum.
        const winner = await this.findReplay(command);
        if (winner) return winner;

        // Outra operação alterou a carteira (versão diferente). Como tudo foi
        // desfeito pelo rollback, é seguro tentar de novo com dados frescos.
        if (attempt >= MAX_ATTEMPTS) throw error;
        this.logger.warn(
          `Conflito de concorrência na carteira ${command.walletId}, tentativa ${attempt}`,
        );
      }
    }
  }

  private async tryOnce(command: RegisterMovementCommand): Promise<MovementResult> {
    let events: DomainEvent[] = [];

    const result = await this.transactionManager.run(async () => {
      const replay = await this.findReplay(command);
      if (replay) return replay;

      const wallet = await this.wallets.findById(command.walletId);
      if (!wallet) {
        throw new NotFoundError('WALLET_NOT_FOUND', `Carteira ${command.walletId} não encontrada`);
      }

      const amount = Money.of(command.amountCents, wallet.currency);
      const transaction =
        command.type === TransactionType.DEPOSIT
          ? wallet.deposit(amount, command.idempotencyKey)
          : wallet.withdraw(amount, command.idempotencyKey);

      await this.wallets.save(wallet);
      await this.transactions.add(transaction);
      events = wallet.pullEvents();
      return { transaction, replayed: false };
    });

    // Neste ponto o commit já aconteceu. Se a publicação falhar, o dinheiro
    // está correto no banco mas o evento se perde: limitação conhecida,
    // resolvida com o padrão outbox (ver README).
    if (events.length > 0) {
      await this.publishSafely(events);
    }
    return result;
  }

  private async findReplay(command: RegisterMovementCommand): Promise<MovementResult | null> {
    const existing = await this.transactions.findByIdempotencyKey(
      command.walletId,
      command.idempotencyKey,
    );
    if (!existing) return null;

    // Mesma chave com outro conteúdo é quase sempre bug no cliente: recusamos.
    if (existing.type !== command.type || existing.amountCents !== command.amountCents) {
      throw new BusinessRuleError(
        'IDEMPOTENCY_KEY_REUSED',
        'Esta Idempotency-Key já foi usada com outro tipo de operação ou valor',
      );
    }
    return { transaction: existing, replayed: true };
  }

  private async publishSafely(events: DomainEvent[]): Promise<void> {
    try {
      await this.events.publish(events);
    } catch (error) {
      // Não devolvemos erro ao cliente: a operação foi concluída com sucesso.
      this.logger.error(
        `Falha ao publicar ${events.length} evento(s) após o commit: ${String(error)}`,
      );
    }
  }
}
