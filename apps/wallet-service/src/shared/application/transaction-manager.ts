/**
 * Executa um bloco de trabalho dentro de uma transação de banco.
 * Tudo que os repositórios gravarem dentro de `work` é confirmado junto
 * (commit) ou desfeito junto (rollback se `work` lançar erro).
 */
export interface TransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');
