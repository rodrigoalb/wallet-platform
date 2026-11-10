import { EntityManager } from '@mikro-orm/postgresql';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly em: EntityManager) {}

  @Get()
  async check(): Promise<{ status: string; checks: Record<string, string> }> {
    try {
      await this.em.getConnection().execute('select 1');
    } catch {
      throw new ServiceUnavailableException({ message: 'Banco de dados indisponível' });
    }
    return { status: 'ok', checks: { database: 'up' } };
  }
}
