import {
  AwsConfig,
  boolEnv,
  intEnv,
  loadJsonSecret,
  optionalEnv,
  readAwsConfigFromEnv,
} from '@app/common';
import { join } from 'node:path';

export interface NotificationConfig {
  port: number;
  aws: AwsConfig;
  queueUrl: string;
  jwtSecret: string;
  /** Habilita POST /dev/tokens para gerar tokens de teste. Nunca em produção. */
  enableDevTokens: boolean;
  publicDir: string;
}

export const NOTIFICATION_CONFIG = Symbol('NOTIFICATION_CONFIG');

const DEV_ONLY_SECRET = 'segredo-apenas-para-desenvolvimento';

/** Configuração síncrona, a partir do ambiente (usada também nos testes). */
export function loadNotificationConfig(): NotificationConfig {
  return {
    port: intEnv('PORT', 3001),
    aws: readAwsConfigFromEnv(),
    queueUrl: optionalEnv(
      'NOTIFICATIONS_QUEUE_URL',
      'http://localhost:4566/000000000000/notifications-queue',
    ),
    jwtSecret: optionalEnv('JWT_SECRET', DEV_ONLY_SECRET),
    enableDevTokens: boolEnv('ENABLE_DEV_TOKENS', false),
    publicDir: optionalEnv('PUBLIC_DIR', join(process.cwd(), 'apps/notification-service/public')),
  };
}

/**
 * Na inicialização real: se JWT_SECRET_ID estiver definido, o segredo do JWT
 * vem do Secrets Manager. Em produção, recusa subir com o segredo de desenvolvimento.
 */
export async function loadNotificationConfigWithSecrets(): Promise<NotificationConfig> {
  const config = loadNotificationConfig();
  const secretId = process.env.JWT_SECRET_ID;
  if (secretId) {
    config.jwtSecret = (await loadJsonSecret<{ secret: string }>(config.aws, secretId)).secret;
  }
  if (process.env.NODE_ENV === 'production' && config.jwtSecret === DEV_ONLY_SECRET) {
    throw new Error('Defina JWT_SECRET_ID (ou JWT_SECRET) em produção');
  }
  return config;
}
