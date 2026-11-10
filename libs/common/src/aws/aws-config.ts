import { optionalEnv } from '../config/env';

export interface AwsConfig {
  region: string;
  /** Endpoint usado pelos serviços (no Docker: http://localstack:4566). Vazio = AWS real. */
  endpoint?: string;
  /**
   * Endpoint visível pelo navegador, usado só para gerar URLs pré-assinadas.
   * No Docker o serviço fala com "localstack", mas o seu computador acessa "localhost".
   */
  publicEndpoint?: string;
}

export function readAwsConfigFromEnv(): AwsConfig {
  const endpoint = process.env.AWS_ENDPOINT || undefined;
  return {
    region: optionalEnv('AWS_REGION', 'us-east-1'),
    endpoint,
    publicEndpoint: process.env.AWS_PUBLIC_ENDPOINT || endpoint,
  };
}

/**
 * Opções comuns a todos os clientes do AWS SDK v3. As credenciais vêm da
 * cadeia padrão do SDK (variáveis de ambiente, perfil, role da instância...),
 * nunca do código.
 */
export function awsClientOptions(config: AwsConfig, endpoint = config.endpoint) {
  return {
    region: config.region,
    ...(endpoint && { endpoint }),
    // O LocalStack usa URLs no formato http://host/bucket/chave.
    ...(endpoint && { forcePathStyle: true }),
  };
}
