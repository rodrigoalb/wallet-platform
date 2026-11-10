import { CORRELATION_HEADER, getCorrelationId } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { LedgerSource } from '../application/ports';
import { LedgerEntry } from '../domain/statement-csv';
import { WORKER_CONFIG, WorkerConfig } from '../config';

interface TransactionPage {
  items: LedgerEntry[];
  total: number;
}

const PAGE_SIZE = 100;

/**
 * Lê os lançamentos pela API REST do wallet-service, página por página.
 * O worker não acessa o banco do wallet-service: cada serviço é dono dos seus dados.
 */
@Injectable()
export class WalletApiLedgerSource implements LedgerSource {
  constructor(@Inject(WORKER_CONFIG) private readonly config: WorkerConfig) {}

  async fetchEntries(walletId: string, from: string, to: string): Promise<LedgerEntry[]> {
    const entries: LedgerEntry[] = [];
    for (let page = 1; ; page++) {
      const result = await this.fetchPage(walletId, from, to, page);
      entries.push(...result.items);
      if (result.items.length === 0 || entries.length >= result.total) return entries;
    }
  }

  private async fetchPage(
    walletId: string,
    from: string,
    to: string,
    page: number,
  ): Promise<TransactionPage> {
    const query = new URLSearchParams({ from, to, page: String(page), limit: String(PAGE_SIZE) });
    const url = `${this.config.walletServiceUrl}/wallets/${walletId}/transactions?${query.toString()}`;
    const response = await fetch(url, {
      // Repassa o correlationId: a chamada aparece nos logs do wallet-service
      // com o mesmo id da requisição que pediu o extrato.
      headers: { [CORRELATION_HEADER]: getCorrelationId() ?? '' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`wallet-service respondeu ${response.status} para ${url}`);
    }
    return (await response.json()) as TransactionPage;
  }
}
