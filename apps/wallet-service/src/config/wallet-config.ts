import { AwsConfig, boolEnv, intEnv, optionalEnv, readAwsConfigFromEnv } from '@app/common';

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
  aws: AwsConfig;
  eventsTopicArn: string;
  statementsBucket: string;
  /** Validade das URLs pré-assinadas de download do extrato. */
  statementUrlTtlSeconds: number;
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
    aws: readAwsConfigFromEnv(),
    eventsTopicArn: optionalEnv(
      'EVENTS_TOPIC_ARN',
      'arn:aws:sns:us-east-1:000000000000:wallet-events',
    ),
    statementsBucket: optionalEnv('STATEMENTS_BUCKET', 'wallet-statements'),
    statementUrlTtlSeconds: intEnv('STATEMENT_URL_TTL_SECONDS', 300),
  };
}
