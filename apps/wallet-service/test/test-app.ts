import { createLogger } from '@app/common';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

/** Sobe a aplicação completa, com o mesmo pipeline HTTP do main.ts. */
export async function createTestApp(): Promise<{ app: INestApplication; orm: MikroORM }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app, createLogger('wallet-service-test'));
  await app.init();
  const orm = app.get(MikroORM);
  await resetDatabase(orm);
  return { app, orm };
}

/** Apaga tudo e reaplica as migrações do zero: cada suíte começa limpa. */
export async function resetDatabase(orm: MikroORM): Promise<void> {
  await orm.getSchemaGenerator().dropSchema({ dropMigrationsTable: true });
  await orm.getMigrator().up();
}
