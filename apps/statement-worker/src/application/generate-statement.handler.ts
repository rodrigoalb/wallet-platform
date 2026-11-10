import { EventEnvelope, EventTypes, statementObjectKey } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { buildStatementCsv } from '../domain/statement-csv';
import { LEDGER_SOURCE, LedgerSource, STATEMENT_FILE_STORE, StatementFileStore } from './ports';

/**
 * Trata statement.requested: busca os lançamentos do período, gera o CSV e
 * grava no S3. É idempotente: se o arquivo já existe, a mensagem é uma
 * entrega repetida e é ignorada.
 */
@Injectable()
export class GenerateStatementHandler {
  private readonly logger = new Logger(GenerateStatementHandler.name);

  constructor(
    @Inject(LEDGER_SOURCE) private readonly ledger: LedgerSource,
    @Inject(STATEMENT_FILE_STORE) private readonly files: StatementFileStore,
  ) {}

  async handle(event: EventEnvelope): Promise<void> {
    if (event.type !== EventTypes.StatementRequested) {
      this.logger.warn(`Evento inesperado ignorado: ${event.type}`);
      return;
    }
    const { statementId, walletId, from, to } = event.payload;
    const key = statementObjectKey(walletId, statementId);

    if (await this.files.exists(key)) {
      this.logger.log(`Extrato ${statementId} já gerado; mensagem duplicada ignorada`);
      return;
    }

    const entries = await this.ledger.fetchEntries(walletId, from, to);
    await this.files.put(key, buildStatementCsv(entries));
    this.logger.log(`Extrato ${statementId} gerado com ${entries.length} lançamento(s)`);
  }
}
