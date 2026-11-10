import {
  AwsConfig,
  boolEnv,
  intEnv,
  loadJsonSecret,
  optionalEnv,
  readAwsConfigFromEnv,
} from '@app/common';

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
  /** Origens de navegador autorizadas a chamar a API (CORS). Vazio = nenhuma. */
  corsOrigins: string[];
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

/**
 * Monta a configuração. Se DB_SECRET_ID estiver definido (caso do Docker),
 * usuário e senha do banco vêm do Secrets Manager; sem ele (testes e
 * desenvolvimento local), vêm das variáveis de ambiente.
 */
export async function loadWalletConfig(): Promise<WalletServiceConfig> {
  const aws = readAwsConfigFromEnv();
  const database = readDatabaseConfigFromEnv();

  const dbSecretId = process.env.DB_SECRET_ID;
  if (dbSecretId) {
    const secret = await loadJsonSecret<{ username: string; password: string }>(aws, dbSecretId);
    database.user = secret.username;
    database.password = secret.password;
  }

  return {
    port: intEnv('PORT', 3000),
    database,
    runMigrationsOnStartup: boolEnv('RUN_MIGRATIONS', true),
    aws,
    eventsTopicArn: optionalEnv(
      'EVENTS_TOPIC_ARN',
      'arn:aws:sns:us-east-1:000000000000:wallet-events',
    ),
    statementsBucket: optionalEnv('STATEMENTS_BUCKET', 'wallet-statements'),
    statementUrlTtlSeconds: intEnv('STATEMENT_URL_TTL_SECONDS', 300),
    corsOrigins: optionalEnv('CORS_ORIGINS', '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
