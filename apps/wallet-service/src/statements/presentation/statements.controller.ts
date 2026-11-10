import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetStatementUseCase } from '../application/get-statement.use-case';
import { RequestStatementUseCase } from '../application/request-statement.use-case';
import { RequestStatementDto } from './dto/request-statement.dto';
import { StatementResponse } from './dto/statement.response';

@ApiTags('statements')
@Controller()
export class StatementsController {
  constructor(
    private readonly requestStatement: RequestStatementUseCase,
    private readonly getStatement: GetStatementUseCase,
  ) {}

  /** 202 Accepted: o pedido foi aceito, mas o arquivo ainda será gerado. */
  @Post('wallets/:id/statements')
  @HttpCode(202)
  @ApiResponse({ status: 202, type: StatementResponse })
  async request(
    @Param('id', ParseUUIDPipe) walletId: string,
    @Body() dto: RequestStatementDto,
  ): Promise<StatementResponse> {
    const statement = await this.requestStatement.execute({
      walletId,
      from: new Date(dto.from),
      to: new Date(dto.to),
    });
    return StatementResponse.from({ statement });
  }

  @Get('statements/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<StatementResponse> {
    return StatementResponse.from(await this.getStatement.execute(id));
  }
}
