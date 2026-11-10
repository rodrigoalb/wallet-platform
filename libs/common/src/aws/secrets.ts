import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AwsConfig, awsClientOptions } from './aws-config';

/**
 * Lê um segredo JSON do AWS Secrets Manager. Chamado uma vez na inicialização
 * do serviço: o valor fica só em memória, nunca em arquivo, variável de
 * ambiente ou log.
 */
export async function loadJsonSecret<T>(aws: AwsConfig, secretId: string): Promise<T> {
  const client = new SecretsManagerClient(awsClientOptions(aws));
  try {
    const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    if (!result.SecretString) {
      throw new Error(`Segredo ${secretId} está vazio`);
    }
    return JSON.parse(result.SecretString) as T;
  } finally {
    client.destroy();
  }
}
