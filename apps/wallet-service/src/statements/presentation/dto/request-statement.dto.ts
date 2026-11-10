import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RequestStatementDto {
  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  to!: string;
}
