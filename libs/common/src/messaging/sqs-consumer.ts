import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Logger } from 'pino';
import { EventEnvelope } from '../events/wallet-events';
import { runWithCorrelationId } from '../logging/correlation';

export interface SqsConsumerOptions {
  client: SQSClient;
  queueUrl: string;
  logger: Logger;
  handle: (event: EventEnvelope) => Promise<void>;
  /** Long polling: a chamada espera até 20 s por mensagens em vez de voltar vazia. */
  waitTimeSeconds?: number;
  batchSize?: number;
}

/**
 * Consumidor SQS simples, compartilhado pelos serviços consumidores.
 *
 * Garantias:
 * - a mensagem só é apagada da fila depois que o handler termina sem erro;
 * - se o handler falhar, a mensagem volta a ficar visível após o
 *   VisibilityTimeout e é tentada de novo; após maxReceiveCount tentativas
 *   o próprio SQS a move para a DLQ;
 * - o correlationId do evento é restaurado, então os logs do consumidor
 *   podem ser ligados à requisição HTTP original.
 *
 * O SQS entrega "pelo menos uma vez": o handler precisa ser idempotente.
 */
export class SqsConsumer {
  private running = false;
  private loop?: Promise<void>;
  private abort?: AbortController;

  constructor(private readonly options: SqsConsumerOptions) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop = this.poll();
    this.options.logger.info({ queueUrl: this.options.queueUrl }, 'Consumidor SQS iniciado');
  }

  async stop(): Promise<void> {
    this.running = false;
    this.abort?.abort();
    await this.loop;
  }

  private async poll(): Promise<void> {
    const { client, queueUrl, logger } = this.options;
    while (this.running) {
      this.abort = new AbortController();
      try {
        const response = await client.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: this.options.batchSize ?? 10,
            WaitTimeSeconds: this.options.waitTimeSeconds ?? 20,
            MessageSystemAttributeNames: ['ApproximateReceiveCount'],
          }),
          { abortSignal: this.abort.signal },
        );
        for (const message of response.Messages ?? []) {
          await this.process(message);
        }
      } catch (error) {
        if (!this.running) break; // stop() abortou o long polling
        logger.error({ err: error }, 'Erro ao receber mensagens; nova tentativa em 5 s');
        await sleep(5000);
      }
    }
  }

  private async process(message: Message): Promise<void> {
    const { client, queueUrl, logger, handle } = this.options;
    const attempt = Number(message.Attributes?.ApproximateReceiveCount ?? 1);

    let event: EventEnvelope;
    try {
      event = JSON.parse(message.Body ?? '') as EventEnvelope;
    } catch {
      // Mensagem malformada nunca vai dar certo: não apagamos, e o SQS a
      // levará para a DLQ após as tentativas, para análise manual.
      logger.error({ messageId: message.MessageId }, 'Mensagem com JSON inválido');
      return;
    }

    await runWithCorrelationId(event.correlationId, async () => {
      try {
        await handle(event);
        await client.send(
          new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }),
        );
        logger.info({ eventId: event.eventId, eventType: event.type }, 'Evento processado');
      } catch (error) {
        logger.warn(
          { err: error, eventId: event.eventId, eventType: event.type, attempt },
          'Falha ao processar evento; ele voltará para a fila',
        );
      }
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
