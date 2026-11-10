import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, Options } from '@mikro-orm/postgresql';
import { Player } from '../players/domain/player.entity';
import { Wallet } from '../wallets/domain/wallet.entity';
import { DatabaseConfig, readDatabaseConfigFromEnv } from '../config/wallet-config';
import { migrationsList } from './migrations';

/**
 * Configuração única do MikroORM, usada pela aplicação, pelos testes e pela CLI.
 * Entidades e migrações são listadas explicitamente (e não por glob) porque o
 * código de produção é empacotado pelo webpack em um único arquivo.
 */
export function buildOrmConfig(db: DatabaseConfig): Options {
  return defineConfig({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    dbName: db.name,
    entities: [Player, Wallet],
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
  });
}

// Exportação padrão usada pela CLI do MikroORM (npx mikro-orm ...).
export default buildOrmConfig(readDatabaseConfigFromEnv());
