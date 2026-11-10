// Testes e2e: sobem o AppModule real contra um PostgreSQL de verdade
// (docker-compose.test.yml, porta 5433).
module.exports = {
  rootDir: '../../..',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'apps/wallet-service/test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/apps/wallet-service/test/setup-env.js'],
  moduleNameMapper: { '^@app/common(|/.*)$': '<rootDir>/libs/common/src/$1' },
  testTimeout: 30000,
};
