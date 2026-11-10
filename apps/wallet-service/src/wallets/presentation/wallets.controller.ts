import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWalletUseCase } from '../application/create-wallet.use-case';
import { GetWalletUseCase } from '../application/get-wallet.use-case';
import { WalletResponse } from './dto/wallet.response';

@ApiTags('wallets')
@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
  ) {}

  @Post('players/:playerId/wallet')
  async create(@Param('playerId', ParseUUIDPipe) playerId: string): Promise<WalletResponse> {
    return WalletResponse.from(await this.createWallet.execute(playerId));
  }

  @Get('wallets/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponse> {
    return WalletResponse.from(await this.getWallet.execute(id));
  }
}
