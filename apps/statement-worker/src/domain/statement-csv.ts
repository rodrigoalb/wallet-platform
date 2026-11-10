/** Lançamento como recebido da API do wallet-service. */
export interface LedgerEntry {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: { amountCents: number; currency: string };
  balanceAfter: { amountCents: number; currency: string };
  idempotencyKey: string;
  createdAt: string;
}

const HEADER = ['data', 'tipo', 'valor', 'saldo_apos', 'moeda', 'lancamento_id'];
const TYPE_LABEL: Record<LedgerEntry['type'], string> = {
  DEPOSIT: 'DEPOSITO',
  WITHDRAWAL: 'SAQUE',
};

/**
 * Monta o CSV do extrato em ordem cronológica. Função pura: fácil de testar.
 * Saques aparecem com sinal negativo para a soma da coluna "valor" fechar com o saldo.
 */
export function buildStatementCsv(entries: LedgerEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows = sorted.map((e) => [
    e.createdAt,
    TYPE_LABEL[e.type],
    centsToDecimal(e.type === 'WITHDRAWAL' ? -e.amount.amountCents : e.amount.amountCents),
    centsToDecimal(e.balanceAfter.amountCents),
    e.amount.currency,
    e.id,
  ]);
  return [HEADER, ...rows].map((cols) => cols.join(',')).join('\n') + '\n';
}

/** 123456 -> "1234.56", sem passar por ponto flutuante. */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
