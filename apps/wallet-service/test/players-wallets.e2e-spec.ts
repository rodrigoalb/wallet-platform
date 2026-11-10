import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

describe('Jogadores e carteiras (e2e)', () => {
  let app: INestApplication<App>;
  let orm: MikroORM;

  beforeAll(async () => {
    ({ app, orm } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('as migrações produzem exatamente o esquema descrito pelas entidades', async () => {
    // Se alguém mudar uma entidade e esquecer a migração, este teste falha.
    const diff = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff.trim()).toBe('');
  });

  it('GET /health responde ok', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, {
        status: 'ok',
        checks: { database: 'up' },
      });
  });

  it('cria jogador, carteira e consulta o saldo', async () => {
    const player = await request(app.getHttpServer())
      .post('/players')
      .send({ name: 'Ana Souza', email: 'ana@example.com' })
      .expect(201);

    await request(app.getHttpServer()).get(`/players/${player.body.id}`).expect(200);

    const wallet = await request(app.getHttpServer())
      .post(`/players/${player.body.id}/wallet`)
      .expect(201);
    expect(wallet.body.balance).toEqual({ amountCents: 0, currency: 'BRL' });

    const fetched = await request(app.getHttpServer())
      .get(`/wallets/${wallet.body.id}`)
      .expect(200);
    expect(fetched.body.playerId).toBe(player.body.id);
  });

  it('devolve o correlationId recebido e o inclui no corpo de erro', async () => {
    const res = await request(app.getHttpServer())
      .get('/players/7b0e8b7e-8f3a-4d55-9d0e-0b6a3c1e2f10')
      .set('X-Correlation-Id', 'teste-123')
      .expect(404);
    expect(res.headers['x-correlation-id']).toBe('teste-123');
    expect(res.body.correlationId).toBe('teste-123');

    const generated = await request(app.getHttpServer()).get('/health').expect(200);
    expect(generated.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('GET /players lista os jogadores com paginação, mais recentes primeiro', async () => {
    const created: string[] = [];
    for (const name of ['Lista Um', 'Lista Dois', 'Lista Tres']) {
      const res = await request(app.getHttpServer())
        .post('/players')
        .send({ name, email: `${name.replace(' ', '.').toLowerCase()}@example.com` })
        .expect(201);
      created.push(res.body.id);
    }

    const all = await request(app.getHttpServer()).get('/players?limit=100').expect(200);
    const ids = (all.body.items as { id: string }[]).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(created));
    // O último criado aparece antes do primeiro.
    expect(ids.indexOf(created[2])).toBeLessThan(ids.indexOf(created[0]));

    const page = await request(app.getHttpServer()).get('/players?page=1&limit=2').expect(200);
    expect(page.body).toMatchObject({ page: 1, limit: 2, total: all.body.total });
    expect(page.body.items).toHaveLength(2);

    await request(app.getHttpServer()).get('/players?limit=1000').expect(400);
  });

  it('GET /players/:id/wallet devolve a carteira do jogador', async () => {
    const player = await request(app.getHttpServer())
      .post('/players')
      .send({ name: 'Dono', email: 'dono@example.com' })
      .expect(201);

    const before = await request(app.getHttpServer())
      .get(`/players/${player.body.id}/wallet`)
      .expect(404);
    expect(before.body.error).toBe('WALLET_NOT_FOUND');

    const wallet = await request(app.getHttpServer())
      .post(`/players/${player.body.id}/wallet`)
      .expect(201);
    const found = await request(app.getHttpServer())
      .get(`/players/${player.body.id}/wallet`)
      .expect(200);
    expect(found.body.id).toBe(wallet.body.id);

    const missing = await request(app.getHttpServer())
      .get('/players/7b0e8b7e-8f3a-4d55-9d0e-0b6a3c1e2f10/wallet')
      .expect(404);
    expect(missing.body.error).toBe('PLAYER_NOT_FOUND');
  });

  it('libera CORS só para as origens configuradas', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3001')
      .expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3001');

    const other = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://site-qualquer.example')
      .expect(200);
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('padroniza erros de validação, conflito e não encontrado', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/players')
      .send({ name: 'B', email: 'nao-e-email' })
      .expect(400);
    expect(invalid.body.error).toBe('VALIDATION_ERROR');

    await request(app.getHttpServer())
      .post('/players')
      .send({ name: 'Bia', email: 'bia@example.com' })
      .expect(201);
    const duplicated = await request(app.getHttpServer())
      .post('/players')
      .send({ name: 'Bia 2', email: 'BIA@example.com' })
      .expect(409);
    expect(duplicated.body.error).toBe('EMAIL_ALREADY_IN_USE');

    const missing = await request(app.getHttpServer())
      .get('/wallets/7b0e8b7e-8f3a-4d55-9d0e-0b6a3c1e2f10')
      .expect(404);
    expect(missing.body.error).toBe('WALLET_NOT_FOUND');
  });
});
