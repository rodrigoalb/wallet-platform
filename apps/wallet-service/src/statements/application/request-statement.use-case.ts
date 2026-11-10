import { EventTypes } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_PUBLISHER, EventPublisher } from '../../shared/application/event-publisher';
import { NotFoundError } from '../../shared/domain/errors';
import { WALLET_REPOSITORY, WalletRepository } from '../../wallets/domain/wallet.repository';
import { Statement } from '../domain/statement.entity';
import { STATEMENT_REPOSITORY, StatementRepository } from '../domain/statement.repository';

export interface RequestStatementCommand {
  walletId: string;
  from: Date;
  to: Date;
}

/**
 * Registra o pedido (status PENDING) e publica statement.requested.
 * A geração do CSV acontece no statement-worker, fora do ciclo da requisição.
 */
@Injectable()
export class RequestStatementUseCase {
  private readonly logger = new Logger(RequestStatementUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository,
    @Inject(STATEMENT_REPOSITORY) private readonly statements: StatementRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: RequestStatementCommand): Promise<Statement> {
    if (!(await this.wallets.findById(command.walletId))) {
      throw new NotFoundError('WALLET_NOT_FOUND', `Carteira ${command.walletId} não encontrada`);
    }
    const statement = new Statement(command.walletId, command.from, command.to);
    await this.statements.save(statement);

    // Publicado após gravar, como nos depósitos. Se falhar, o pedido fica
    // PENDING e o cliente pode pedir de novo (ver limitações no README).
    try {
      await this.events.publish([
        {
          type: EventTypes.StatementRequested,
          payload: {
            statementId: statement.id,
            walletId: statement.walletId,
            from: statement.periodFrom.toISOString(),
            to: statement.periodTo.toISOString(),
          },
        },
      ]);
    } catch (error) {
      this.logger.error(`Falha ao publicar statement.requested: ${String(error)}`);
    }
    return statement;
  }
}
