import { EventEnvelope } from '@app/common';
import { LedgerEntry } from '../domain/statement-csv';
import { GenerateStatementHandler } from './generate-statement.handler';
import { LedgerSource, StatementFileStore } from './ports';

class FakeStore implements StatementFileStore {
  readonly files = new Map<string, string>();
  exists(key: string) {
    return Promise.resolve(this.files.has(key));
  }
  put(key: string, csv: string) {
    this.files.set(key, csv);
    return Promise.resolve();
  }
}

const event: EventEnvelope = {
  eventId: 'e1',
  correlationId: 'c1',
  occurredAt: '2026-01-01T00:00:00Z',
  type: 'statement.requested',
  payload: { statementId: 's1', walletId: 'w1', from: '2026-01-01', to: '2026-02-01' },
};

describe('GenerateStatementHandler', () => {
  let store: FakeStore;
  let ledger: jest.Mocked<LedgerSource>;
  let handler: GenerateStatementHandler;

  beforeEach(() => {
    store = new FakeStore();
    const entry: LedgerEntry = {
      id: 't1',
      type: 'DEPOSIT',
      amount: { amountCents: 500, currency: 'BRL' },
      balanceAfter: { amountCents: 500, currency: 'BRL' },
      idempotencyKey: 'k',
      createdAt: '2026-01-10T00:00:00.000Z',
    };
    ledger = { fetchEntries: jest.fn().mockResolvedValue([entry]) };
    handler = new GenerateStatementHandler(ledger, store);
  });

  it('gera o CSV do período na chave combinada com o wallet-service', async () => {
    await handler.handle(event);

    expect(ledger.fetchEntries).toHaveBeenCalledWith('w1', '2026-01-01', '2026-02-01');
    expect(store.files.get('statements/w1/s1.csv')).toContain('DEPOSITO,5.00,5.00,BRL,t1');
  });

  it('ignora mensagem repetida quando o arquivo já existe', async () => {
    await handler.handle(event);
    await handler.handle(event);

    expect(ledger.fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('propaga erro da API para que a mensagem volte à fila', async () => {
    ledger.fetchEntries.mockRejectedValueOnce(new Error('wallet-service indisponível'));

    await expect(handler.handle(event)).rejects.toThrow('indisponível');
    expect(store.files.size).toBe(0);
  });
});
