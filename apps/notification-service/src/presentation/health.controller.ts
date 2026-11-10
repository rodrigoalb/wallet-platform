import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { NotificationsQueueListener } from '../infrastructure/notifications-queue.listener';

@Controller('health')
export class HealthController {
  constructor(private readonly listener: NotificationsQueueListener) {}

  @Get()
  check(): { status: string; checks: Record<string, string> } {
    if (!this.listener.running) {
      throw new ServiceUnavailableException('Consumidor SQS parado');
    }
    return { status: 'ok', checks: { consumer: 'running' } };
  }
}
