import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IdempotencyKey } from '../../shared/http/idempotency-key.decorator';
import { CreateWalletUseCase } from '../application/create-wallet.use-case';
import { GetWalletUseCase } from '../application/get-wallet.use-case';
import { ListTransactionsUseCase } from '../application/list-transactions.use-case';
import { MovementResult, RegisterMovementUseCase } from '../application/register-movement.use-case';
import { TransactionType } from '../domain/transaction.entity';
import { ListTransactionsQuery } from './dto/list-transactions.query';
import { MovementDto } from './dto/movement.dto';
import { TransactionPageResponse, TransactionResponse } from './dto/transaction.response';
import { WalletResponse } from './dto/wallet.response';

const idempotencyHeader = ApiHeader({
  name: 'Idempotency-Key',
  required: true,
  description: 'Chave única gerada pelo cliente. Repetir a mesma chave não duplica a operação.',
});

@ApiTags('wallets')
@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
    private readonly registerMovement: RegisterMovementUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
  ) {}

  @Post('players/:playerId/wallet')
  async create(@Param('playerId', ParseUUIDPipe) playerId: string): Promise<WalletResponse> {
    return WalletResponse.from(await this.createWallet.execute(playerId));
  }

  @Get('wallets/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponse> {
    return WalletResponse.from(await this.getWallet.execute(id));
  }

  @Post('wallets/:id/deposits')
  @idempotencyHeader
  @ApiResponse({ status: 201, type: TransactionResponse })
  async deposit(
    @Param('id', ParseUUIDPipe) walletId: string,
    @IdempotencyKey() idempotencyKey: string,
    @Body() dto: MovementDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TransactionResponse> {
    const result = await this.registerMovement.execute({
      walletId,
      type: TransactionType.DEPOSIT,
      amountCents: dto.amountCents,
      idempotencyKey,
    });
    return toResponse(result, res);
  }

  @Post('wallets/:id/withdrawals')
  @idempotencyHeader
  @ApiResponse({ status: 201, type: TransactionResponse })
  @ApiResponse({ status: 422, description: 'Saldo insuficiente' })
  async withdraw(
    @Param('id', ParseUUIDPipe) walletId: string,
    @IdempotencyKey() idempotencyKey: string,
    @Body() dto: MovementDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TransactionResponse> {
    const result = await this.registerMovement.execute({
      walletId,
      type: TransactionType.WITHDRAWAL,
      amountCents: dto.amountCents,
      idempotencyKey,
    });
    return toResponse(result, res);
  }

  @Get('wallets/:id/transactions')
  async transactions(
    @Param('id', ParseUUIDPipe) walletId: string,
    @Query() query: ListTransactionsQuery,
  ): Promise<TransactionPageResponse> {
    const page = await this.listTransactions.execute({
      walletId,
      type: query.type,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: page.items.map((t) => TransactionResponse.from(t)),
      page: query.page,
      limit: query.limit,
      total: page.total,
    };
  }
}

/** Repetições devolvem o mesmo corpo; o header só sinaliza que nada novo aconteceu. */
function toResponse(result: MovementResult, res: Response): TransactionResponse {
  res.setHeader('Idempotent-Replayed', String(result.replayed));
  return TransactionResponse.from(result.transaction);
}
