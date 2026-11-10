import { Migration } from '@mikro-orm/migrations';

/**
 * Segunda migração: evolui o esquema com o ledger.
 * - tabela transactions com unicidade (wallet_id, idempotency_key)
 * - índice (wallet_id, created_at) para extrato e listagem por período
 * - coluna wallets.updated_at (carteiras já existentes recebem now())
 * - trigger que torna o ledger imutável no próprio banco
 */
export class Migration20261110181226 extends Migration {
  override up(): void {
    this.addSql(
      `create table "transactions" ("id" uuid not null, "wallet_id" uuid not null, "type" text check ("type" in ('DEPOSIT', 'WITHDRAWAL')) not null, "amount_cents" bigint not null, "balance_after_cents" bigint not null, "currency" varchar(3) not null, "idempotency_key" varchar(100) not null, "created_at" timestamptz not null, constraint "transactions_pkey" primary key ("id"), constraint transactions_amount_cents_check check (amount_cents > 0), constraint transactions_balance_after_cents_check check (balance_after_cents >= 0));`,
    );
    this.addSql(
      `create index "transactions_wallet_id_created_at_index" on "transactions" ("wallet_id", "created_at");`,
    );
    this.addSql(
      `alter table "transactions" add constraint "transactions_wallet_id_idempotency_key_unique" unique ("wallet_id", "idempotency_key");`,
    );
    this.addSql(
      `alter table "transactions" add constraint "transactions_wallet_id_foreign" foreign key ("wallet_id") references "wallets" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "wallets" add column "updated_at" timestamptz not null default now();`,
    );

    // Defesa em profundidade: mesmo um UPDATE/DELETE manual no ledger é recusado.
    this.addSql(`
      create or replace function forbid_ledger_changes() returns trigger as $$
      begin
        raise exception 'O ledger (transactions) é imutável: % não é permitido', tg_op;
      end;
      $$ language plpgsql;`);
    this.addSql(`
      create trigger transactions_immutable
      before update or delete on "transactions"
      for each row execute function forbid_ledger_changes();`);
  }

  override down(): void {
    this.addSql(`drop table if exists "transactions" cascade;`);
    this.addSql(`drop function if exists forbid_ledger_changes();`);
    this.addSql(`alter table "wallets" drop column "updated_at";`);
  }
}
