import { AwsConfig, boolEnv, intEnv, optionalEnv, readAwsConfigFromEnv } from '@app/common';
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

export function loadNotificationConfig(): NotificationConfig {
  return {
    port: intEnv('PORT', 3001),
    aws: readAwsConfigFromEnv(),
    queueUrl: optionalEnv(
      'NOTIFICATIONS_QUEUE_URL',
      'http://localhost:4566/000000000000/notifications-queue',
    ),
    jwtSecret: optionalEnv('JWT_SECRET', 'segredo-apenas-para-desenvolvimento'),
    enableDevTokens: boolEnv('ENABLE_DEV_TOKENS', false),
    publicDir: optionalEnv('PUBLIC_DIR', join(process.cwd(), 'apps/notification-service/public')),
  };
}
