/**
 * Seed opcional: cria um jogador de exemplo com carteira e um depósito inicial.
 * Uso: npm run seed (com o banco no ar e as migrações aplicadas).
 */
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import { Player } from '../players/domain/player.entity';
import { Money } from '../wallets/domain/money';
import { Wallet } from '../wallets/domain/wallet.entity';
import { readDatabaseConfigFromEnv } from '../config/wallet-config';
import { buildOrmConfig } from './mikro-orm.config';

const DEMO_EMAIL = 'demo@wallet.local';

async function seed(): Promise<void> {
  const orm = await MikroORM.init(buildOrmConfig(readDatabaseConfigFromEnv()));
  const em = orm.em.fork();

  if (await em.findOne(Player, { email: DEMO_EMAIL })) {
    console.log('Seed já aplicado, nada a fazer.');
    await orm.close();
    return;
  }

  const player = new Player('Jogador Demo', DEMO_EMAIL);
  const wallet = new Wallet(player.id);
  const firstDeposit = wallet.deposit(Money.of(10000), 'seed-initial-deposit');
  // flush() grava tudo numa única transação.
  await em.persist([player, wallet, firstDeposit]).flush();
  console.log(`Jogador ${player.id} criado com a carteira ${wallet.id} e saldo de R$ 100,00`);
  await orm.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
