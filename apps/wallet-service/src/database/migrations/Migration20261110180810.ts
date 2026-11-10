import { Migration } from '@mikro-orm/migrations';

/**
 * Migração inicial: jogadores e carteiras.
 * Gerada pela CLI do MikroORM a partir das entidades e revisada à mão.
 */
export class Migration20261110180810 extends Migration {
  override up(): void {
    this.addSql(
      `create table "players" ("id" uuid not null, "name" varchar(120) not null, "email" varchar(254) not null, "created_at" timestamptz not null, constraint "players_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "players" add constraint "players_email_unique" unique ("email");`);

    // A constraint CHECK é uma segunda linha de defesa: mesmo com um bug no
    // domínio, o banco recusa saldo negativo.
    this.addSql(
      `create table "wallets" ("id" uuid not null, "player_id" uuid not null, "balance_cents" bigint not null default 0, "currency" varchar(3) not null default 'BRL', "version" int not null default 1, "created_at" timestamptz not null, constraint "wallets_pkey" primary key ("id"), constraint wallets_balance_cents_check check (balance_cents >= 0));`,
    );
    this.addSql(
      `alter table "wallets" add constraint "wallets_player_id_unique" unique ("player_id");`,
    );
    this.addSql(
      `alter table "wallets" add constraint "wallets_player_id_foreign" foreign key ("player_id") references "players" ("id") on update cascade;`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "wallets" cascade;`);
    this.addSql(`drop table if exists "players" cascade;`);
  }
}
