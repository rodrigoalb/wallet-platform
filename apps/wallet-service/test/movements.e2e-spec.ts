import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

describe('Depósitos, saques e ledger (e2e)', () => {
  let app: INestApplication<App>;
  let orm: MikroORM;
  let walletId: string;
  let emailCounter = 0;

  const http = () => request(app.getHttpServer());
  const deposit = (amountCents: number, key: string, id = walletId) =>
    http().post(`/wallets/${id}/deposits`).set('Idempotency-Key', key).send({ amountCents });
  const withdraw = (amountCents: number, key: string, id = walletId) =>
    http().post(`/wallets/${id}/withdrawals`).set('Idempotency-Key', key).send({ amountCents });
  const balanceOf = async (id = walletId): Promise<number> =>
    (await http().get(`/wallets/${id}`).expect(200)).body.balance.amountCents;

  async function newWallet(): Promise<string> {
    const player = await http()
      .post('/players')
      .send({ name: 'Jogador Teste', email: `jogador${++emailCounter}@example.com` })
      .expect(201);
    return (await http().post(`/players/${player.body.id}/wallet`).expect(201)).body.id;
  }

  beforeAll(async () => {
    ({ app, orm } = await createTestApp());
  });

  beforeEach(async () => {
    walletId = await newWallet();
  });

  afterAll(async () => {
    await app.close();
  });

  it('depósito e saque atualizam o saldo e geram lançamentos', async () => {
    const dep = await deposit(10000, 'dep-1').expect(201);
    expect(dep.headers['idempotent-replayed']).toBe('false');
    expect(dep.body).toMatchObject({
      type: 'DEPOSIT',
      amount: { amountCents: 10000, currency: 'BRL' },
      balanceAfter: { amountCents: 10000, currency: 'BRL' },
    });

    const wd = await withdraw(2550, 'wd-1').expect(201);
    expect(wd.body.balanceAfter.amountCents).toBe(7450);
    expect(await balanceOf()).toBe(7450);
  });

  it('exige o header Idempotency-Key', async () => {
    const res = await http().post(`/wallets/${walletId}/deposits`).send({ amountCents: 100 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Idempotency-Key');
  });

  it('repetir a chave devolve o mesmo resultado sem duplicar', async () => {
    const first = await deposit(5000, 'same-key').expect(201);
    const second = await deposit(5000, 'same-key').expect(201);

    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body).toEqual(first.body);
    expect(await balanceOf()).toBe(5000);

    const list = await http().get(`/wallets/${walletId}/transactions`).expect(200);
    expect(list.body.total).toBe(1);
  });

  it('recusa a mesma chave com outro valor (422)', async () => {
    await deposit(5000, 'k1').expect(201);
    const res = await deposit(6000, 'k1').expect(422);
    expect(res.body.error).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('saque maior que o saldo retorna 422 e não altera nada', async () => {
    await deposit(1000, 'dep').expect(201);
    const res = await withdraw(1001, 'wd').expect(422);
    expect(res.body.error).toBe('INSUFFICIENT_FUNDS');
    expect(await balanceOf()).toBe(1000);
  });

  it('valida o corpo: valor inteiro e positivo', async () => {
    await deposit(0, 'a').expect(400);
    await deposit(10.5, 'b').expect(400);
    await http()
      .post(`/wallets/${walletId}/deposits`)
      .set('Idempotency-Key', 'c')
      .send({ amountCents: '100' })
      .expect(400);
  });

  it('lista lançamentos com filtro por tipo, período e paginação', async () => {
    await deposit(100, 'd1').expect(201);
    await deposit(200, 'd2').expect(201);
    await deposit(300, 'd3').expect(201);
    await withdraw(50, 'w1').expect(201);

    const deposits = await http()
      .get(`/wallets/${walletId}/transactions?type=DEPOSIT&page=1&limit=2`)
      .expect(200);
    expect(deposits.body.total).toBe(3);
    expect(deposits.body.items).toHaveLength(2);
    // Mais recentes primeiro.
    expect(deposits.body.items[0].amount.amountCents).toBe(300);

    const page2 = await http()
      .get(`/wallets/${walletId}/transactions?type=DEPOSIT&page=2&limit=2`)
      .expect(200);
    expect(page2.body.items).toHaveLength(1);

    const future = await http()
      .get(`/wallets/${walletId}/transactions?from=2999-01-01T00:00:00Z`)
      .expect(200);
    expect(future.body.total).toBe(0);
  });

  it('depósitos concorrentes não perdem atualização (optimistic locking)', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => deposit(100, `conc-${i}`)),
    );
    const ok = results.filter((r) => r.status === 201).length;
    // Os retries internos fazem a maioria passar mesmo com todas disputando a mesma linha.
    expect(ok).toBeGreaterThan(1);

    // Toda resposta é sucesso ou 409 (conflito após as tentativas internas).
    expect(results.every((r) => r.status === 201 || r.status === 409)).toBe(true);
    // E o saldo é exatamente a soma dos depósitos aceitos: nada perdido, nada duplicado.
    expect(await balanceOf()).toBe(ok * 100);
    const list = await http().get(`/wallets/${walletId}/transactions?limit=100`).expect(200);
    expect(list.body.total).toBe(ok);
  });

  it('requisições simultâneas com a mesma chave geram um único lançamento', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => deposit(700, 'race-key')));

    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
    expect(await balanceOf()).toBe(700);
  });

  it('o banco recusa alterar ou apagar lançamentos do ledger', async () => {
    await deposit(100, 'imm').expect(201);
    const conn = (orm.em as EntityManager).getConnection();

    await expect(conn.execute('update transactions set amount_cents = 1')).rejects.toThrow(
      'imutável',
    );
    await expect(conn.execute('delete from transactions')).rejects.toThrow('imutável');
  });
});
