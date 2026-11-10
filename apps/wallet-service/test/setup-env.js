// Valores padrão apontando para o banco de teste; podem ser sobrescritos (ex.: no CI).
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5433';
process.env.DB_USER ??= 'wallet';
process.env.DB_PASSWORD ??= 'wallet';
process.env.DB_NAME ??= 'wallet_test';
// O próprio teste controla as migrações (ver resetDatabase).
process.env.RUN_MIGRATIONS = 'false';
