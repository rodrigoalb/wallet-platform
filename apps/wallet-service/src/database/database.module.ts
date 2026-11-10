import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { WALLET_CONFIG, WalletServiceConfig } from '../config/wallet-config';
import { buildOrmConfig } from './mikro-orm.config';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      inject: [WALLET_CONFIG],
      useFactory: (config: WalletServiceConfig) => buildOrmConfig(config.database),
      driver: PostgreSqlDriver,
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    private readonly orm: MikroORM,
    @Inject(WALLET_CONFIG) private readonly config: WalletServiceConfig,
  ) {}

  /**
   * Aplica migrações pendentes antes de a API começar a aceitar requisições.
   * Simples para a demonstração; em produção isso costuma ser um passo
   * separado do deploy (ver "Limitações" no README).
   */
  async onModuleInit(): Promise<void> {
    if (!this.config.runMigrationsOnStartup) return;
    const applied = await this.orm.getMigrator().up();
    this.logger.log(`Migrações aplicadas: ${applied.map((m) => m.name).join(', ') || 'nenhuma'}`);
  }
}
