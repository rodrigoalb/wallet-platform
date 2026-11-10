import { buildStatementCsv, centsToDecimal, LedgerEntry } from './statement-csv';

const entry = (over: Partial<LedgerEntry>): LedgerEntry => ({
  id: 'id',
  type: 'DEPOSIT',
  amount: { amountCents: 0, currency: 'BRL' },
  balanceAfter: { amountCents: 0, currency: 'BRL' },
  idempotencyKey: 'k',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('buildStatementCsv', () => {
  it('gera cabeçalho e linhas em ordem cronológica, com saque negativo', () => {
    const csv = buildStatementCsv([
      entry({
        id: 't2',
        type: 'WITHDRAWAL',
        amount: { amountCents: 2550, currency: 'BRL' },
        balanceAfter: { amountCents: 7450, currency: 'BRL' },
        createdAt: '2026-01-02T10:00:00.000Z',
      }),
      entry({
        id: 't1',
        amount: { amountCents: 10000, currency: 'BRL' },
        balanceAfter: { amountCents: 10000, currency: 'BRL' },
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
    ]);

    expect(csv).toBe(
      'data,tipo,valor,saldo_apos,moeda,lancamento_id\n' +
        '2026-01-01T10:00:00.000Z,DEPOSITO,100.00,100.00,BRL,t1\n' +
        '2026-01-02T10:00:00.000Z,SAQUE,-25.50,74.50,BRL,t2\n',
    );
  });

  it('extrato vazio tem só o cabeçalho', () => {
    expect(buildStatementCsv([])).toBe('data,tipo,valor,saldo_apos,moeda,lancamento_id\n');
  });
});

describe('centsToDecimal', () => {
  it.each([
    [0, '0.00'],
    [5, '0.05'],
    [1050, '10.50'],
    [-1, '-0.01'],
    [123456789, '1234567.89'],
  ])('%p -> %p', (cents, expected) => {
    expect(centsToDecimal(cents)).toBe(expected);
  });
});
