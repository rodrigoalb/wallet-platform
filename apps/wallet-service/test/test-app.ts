import { createLogger } from '@app/common';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { EVENT_PUBLISHER } from '../src/shared/application/event-publisher';
import { STATEMENT_STORAGE } from '../src/statements/application/statement-storage';
import {
  InMemoryStatementStorage,
  RecordingEventPublisher,
} from '../src/testing/in-memory-repositories';

export interface TestApp {
  app: INestApplication;
  orm: MikroORM;
  /** Substitui o SNS: guarda os eventos para o teste inspecionar. */
  events: RecordingEventPublisher;
  /** Substitui o S3. */
  storage: InMemoryStatementStorage;
}

/**
 * Sobe a aplicação completa, com o mesmo pipeline HTTP do main.ts e um
 * PostgreSQL real. Só os adaptadores AWS são trocados por versões em memória.
 */
export async function createTestApp(): Promise<TestApp> {
  const events = new RecordingEventPublisher();
  const storage = new InMemoryStatementStorage();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EVENT_PUBLISHER)
    .useValue(events)
    .overrideProvider(STATEMENT_STORAGE)
    .useValue(storage)
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app, createLogger('wallet-service-test'));
  await app.init();
  const orm = app.get(MikroORM);
  await resetDatabase(orm);
  return { app, orm, events, storage };
}

/** Apaga tudo e reaplica as migrações do zero: cada suíte começa limpa. */
export async function resetDatabase(orm: MikroORM): Promise<void> {
  await orm.getSchemaGenerator().dropSchema({ dropMigrationsTable: true });
  await orm.getMigrator().up();
}
