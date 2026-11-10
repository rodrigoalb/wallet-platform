import { EventTypes } from '@app/common';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  InMemoryStatementStorage,
  RecordingEventPublisher,
} from '../src/testing/in-memory-repositories';
import { createTestApp } from './test-app';

describe('Extratos e eventos (e2e)', () => {
  let app: INestApplication<App>;
  let events: RecordingEventPublisher;
  let storage: InMemoryStatementStorage;
  let walletId: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, events, storage } = await createTestApp());
    const player = await http()
      .post('/players')
      .send({ name: 'Carla', email: 'carla@example.com' })
      .expect(201);
    walletId = (await http().post(`/players/${player.body.id}/wallet`).expect(201)).body.id;
  });

  beforeEach(() => {
    events.published.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('depósito publica transaction.created e wallet.balance-updated', async () => {
    await http()
      .post(`/wallets/${walletId}/deposits`)
      .set('Idempotency-Key', 'evt-1')
      .send({ amountCents: 1234 })
      .expect(201);

    expect(events.published.map((e) => e.type)).toEqual([
      EventTypes.TransactionCreated,
      EventTypes.BalanceUpdated,
    ]);
    expect(events.published[1].payload).toMatchObject({ walletId, balanceCents: 1234 });
  });

  it('operação recusada não publica eventos', async () => {
    await http()
      .post(`/wallets/${walletId}/withdrawals`)
      .set('Idempotency-Key', 'evt-2')
      .send({ amountCents: 999_999 })
      .expect(422);
    expect(events.published).toHaveLength(0);
  });

  it('pedido de extrato fica PENDING, publica o evento e vira READY quando o arquivo existe', async () => {
    const requested = await http()
      .post(`/wallets/${walletId}/statements`)
      .send({ from: '2026-01-01T00:00:00Z', to: '2026-12-31T23:59:59Z' })
      .expect(202);
    expect(requested.body.status).toBe('PENDING');
    expect(events.published).toEqual([
      {
        type: EventTypes.StatementRequested,
        payload: {
          statementId: requested.body.id,
          walletId,
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-12-31T23:59:59.000Z',
        },
      },
    ]);

    const pending = await http().get(`/statements/${requested.body.id}`).expect(200);
    expect(pending.body.status).toBe('PENDING');
    expect(pending.body.downloadUrl).toBeUndefined();

    // Simula o statement-worker gravando o CSV no S3.
    storage.objects.add(`statements/${walletId}/${requested.body.id}.csv`);

    const ready = await http().get(`/statements/${requested.body.id}`).expect(200);
    expect(ready.body.status).toBe('READY');
    expect(ready.body.downloadUrl).toContain('expires=300');
    expect(ready.body.downloadUrlExpiresAt).toBeDefined();
  });

  it('valida o período do extrato', async () => {
    const res = await http()
      .post(`/wallets/${walletId}/statements`)
      .send({ from: '2026-12-31T00:00:00Z', to: '2026-01-01T00:00:00Z' })
      .expect(400);
    expect(res.body.error).toBe('INVALID_PERIOD');
  });
});
