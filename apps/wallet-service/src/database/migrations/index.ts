import { MigrationObject } from '@mikro-orm/core';
import { Migration20261110180810 } from './Migration20261110180810';
import { Migration20261110181226 } from './Migration20261110181226';

/**
 * Lista ordenada das migrações. Cada nova migração precisa ser registrada aqui
 * (o webpack empacota tudo num arquivo só, então não dá para descobrir por glob).
 */
export const migrationsList: MigrationObject[] = [
  { name: 'Migration20261110180810', class: Migration20261110180810 },
  { name: 'Migration20261110181226', class: Migration20261110181226 },
];
