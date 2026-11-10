/**
 * Leitura de variáveis de ambiente com falha rápida.
 * Preferimos funções simples a uma biblioteca de configuração: cada serviço
 * monta seu próprio objeto de configuração tipado a partir delas.
 */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? defaultValue : value;
}

export function intEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Variável de ambiente ${name} deveria ser um inteiro, recebido: ${raw}`);
  }
  return parsed;
}

export function boolEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1';
}
