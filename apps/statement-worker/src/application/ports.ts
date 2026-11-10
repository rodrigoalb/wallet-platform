import { LedgerEntry } from '../domain/statement-csv';

/** De onde vêm os lançamentos (a API do wallet-service, dona desses dados). */
export interface LedgerSource {
  fetchEntries(walletId: string, from: string, to: string): Promise<LedgerEntry[]>;
}

/** Onde o arquivo do extrato é guardado (S3). */
export interface StatementFileStore {
  exists(key: string): Promise<boolean>;
  put(key: string, csv: string): Promise<void>;
}

export const LEDGER_SOURCE = Symbol('LEDGER_SOURCE');
export const STATEMENT_FILE_STORE = Symbol('STATEMENT_FILE_STORE');
