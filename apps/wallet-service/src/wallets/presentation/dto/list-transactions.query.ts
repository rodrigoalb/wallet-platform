import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQuery } from '../../../shared/http/pagination.query';
import { TransactionType } from '../../domain/transaction.entity';

export class ListTransactionsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z', description: 'Início (inclusivo)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Fim (inclusivo)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
