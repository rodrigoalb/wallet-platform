import { Module } from '@nestjs/common';
import { WalletsModule } from '../wallets/wallets.module';
import { GetStatementUseCase } from './application/get-statement.use-case';
import { RequestStatementUseCase } from './application/request-statement.use-case';
import { STATEMENT_STORAGE } from './application/statement-storage';
import { STATEMENT_REPOSITORY } from './domain/statement.repository';
import { MikroOrmStatementRepository } from './infrastructure/mikro-orm-statement.repository';
import { S3StatementStorage } from './infrastructure/s3-statement.storage';
import { StatementsController } from './presentation/statements.controller';

@Module({
  imports: [WalletsModule],
  controllers: [StatementsController],
  providers: [
    RequestStatementUseCase,
    GetStatementUseCase,
    { provide: STATEMENT_REPOSITORY, useClass: MikroOrmStatementRepository },
    { provide: STATEMENT_STORAGE, useClass: S3StatementStorage },
  ],
})
export class StatementsModule {}
