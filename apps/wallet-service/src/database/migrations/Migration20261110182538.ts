import { Migration } from '@mikro-orm/migrations';

/** Terceira migração: pedidos de extrato processados pelo statement-worker. */
export class Migration20261110182538 extends Migration {
  override up(): void {
    this.addSql(
      `create table "statements" ("id" uuid not null, "wallet_id" uuid not null, "period_from" timestamptz not null, "period_to" timestamptz not null, "status" text check ("status" in ('PENDING', 'READY')) not null, "object_key" varchar(255) not null, "created_at" timestamptz not null, "ready_at" timestamptz null, constraint "statements_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "statements" add constraint "statements_wallet_id_foreign" foreign key ("wallet_id") references "wallets" ("id") on update cascade;`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "statements" cascade;`);
  }
}
