import { Inject, Injectable } from '@nestjs/common';
import { WALLET_CONFIG, WalletServiceConfig } from '../../config/wallet-config';
import { NotFoundError } from '../../shared/domain/errors';
import { Statement, StatementStatus } from '../domain/statement.entity';
import { STATEMENT_REPOSITORY, StatementRepository } from '../domain/statement.repository';
import { STATEMENT_STORAGE, StatementStorage } from './statement-storage';

export interface StatementView {
  statement: Statement;
  download?: { url: string; expiresAt: Date };
}

/**
 * Consulta o pedido. Enquanto estiver PENDING, verifica se o worker já gravou
 * o arquivo no S3; se sim, marca como READY. Assim o worker não precisa
 * acessar o banco do wallet-service (cada serviço é dono dos seus dados).
 */
@Injectable()
export class GetStatementUseCase {
  constructor(
    @Inject(STATEMENT_REPOSITORY) private readonly statements: StatementRepository,
    @Inject(STATEMENT_STORAGE) private readonly storage: StatementStorage,
    @Inject(WALLET_CONFIG) private readonly config: WalletServiceConfig,
  ) {}

  async execute(id: string): Promise<StatementView> {
    const statement = await this.statements.findById(id);
    if (!statement) {
      throw new NotFoundError('STATEMENT_NOT_FOUND', `Extrato ${id} não encontrado`);
    }

    if (
      statement.status === StatementStatus.PENDING &&
      (await this.storage.exists(statement.objectKey))
    ) {
      statement.markReady();
      await this.statements.save(statement);
    }

    if (statement.status !== StatementStatus.READY) {
      return { statement };
    }
    const ttl = this.config.statementUrlTtlSeconds;
    return {
      statement,
      download: {
        url: await this.storage.createDownloadUrl(statement.objectKey, ttl),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    };
  }
}
