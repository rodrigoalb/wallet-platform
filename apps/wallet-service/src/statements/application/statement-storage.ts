/** Porta para o armazenamento de arquivos de extrato (S3 em produção). */
export interface StatementStorage {
  exists(objectKey: string): Promise<boolean>;
  /** URL temporária que permite baixar o arquivo sem credenciais AWS. */
  createDownloadUrl(objectKey: string, ttlSeconds: number): Promise<string>;
}

export const STATEMENT_STORAGE = Symbol('STATEMENT_STORAGE');
