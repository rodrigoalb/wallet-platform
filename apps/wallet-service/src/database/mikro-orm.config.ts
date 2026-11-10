import { createLogger } from '@app/common';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, Options } from '@mikro-orm/postgresql';
import { Player } from '../players/domain/player.entity';
import { Statement } from '../statements/domain/statement.entity';
import { Transaction } from '../wallets/domain/transaction.entity';
import { Wallet } from '../wallets/domain/wallet.entity';
import { DatabaseConfig, readDatabaseConfigFromEnv } from '../config/wallet-config';
import { migrationsList } from './migrations';

/**
 * Configuração única do MikroORM, usada pela aplicação, pelos testes e pela CLI.
 * Entidades e migrações são listadas explicitamente (e não por glob) porque o
 * código de produção é empacotado pelo webpack em um único arquivo.
 */
export function buildOrmConfig(db: DatabaseConfig): Options {
  const ormLogger = createLogger('wallet-service').child({ context: 'MikroORM' });
  return defineConfig({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    dbName: db.name,
    entities: [Player, Wallet, Transaction, Statement],
    extensions: [Migrator],
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: 'apps/wallet-service/src/database/migrations',
      migrationsList,
      // Cada migração roda dentro de uma transação; se uma falhar, nenhuma é aplicada.
      transactional: true,
      allOrNothing: true,
      snapshot: false,
    },
    // O esquema evolui só por migrações versionadas, nunca por sincronização automática.
    ensureDatabase: false,
    // Logs do ORM (ex.: migrações aplicadas) saem no mesmo formato JSON do resto.
    colors: false,
    logger: (message) => ormLogger.info(message),
  });
}

// Exportação padrão usada pela CLI do MikroORM (npx mikro-orm ...).
export default buildOrmConfig(readDatabaseConfigFromEnv());
