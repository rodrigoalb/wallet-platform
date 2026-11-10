import { Global, Module } from '@nestjs/common';
import { loadWalletConfig, WALLET_CONFIG } from './wallet-config';

@Global()
@Module({
  providers: [{ provide: WALLET_CONFIG, useFactory: loadWalletConfig }],
  exports: [WALLET_CONFIG],
})
export class ConfigModule {}
