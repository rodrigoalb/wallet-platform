import { boolEnv, intEnv, optionalEnv } from '@app/common';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
}

export interface WalletServiceConfig {
  port: number;
  database: DatabaseConfig;
  runMigrationsOnStartup: boolean;
}

/** Token de injeção da configuração (equivalente a um @ConfigurationProperties do Spring). */
export const WALLET_CONFIG = Symbol('WALLET_CONFIG');

export function readDatabaseConfigFromEnv(): DatabaseConfig {
  return {
    host: optionalEnv('DB_HOST', 'localhost'),
    port: intEnv('DB_PORT', 5432),
    user: optionalEnv('DB_USER', 'wallet'),
    password: optionalEnv('DB_PASSWORD', 'wallet'),
    name: optionalEnv('DB_NAME', 'wallet'),
  };
}

export function loadWalletConfig(): WalletServiceConfig {
  return {
    port: intEnv('PORT', 3000),
    database: readDatabaseConfigFromEnv(),
    runMigrationsOnStartup: boolEnv('RUN_MIGRATIONS', true),
  };
}
