import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Max } from 'class-validator';

export class MovementDto {
  @ApiProperty({ example: 5000, description: 'Valor em centavos (5000 = R$ 50,00)' })
  @IsInt()
  @IsPositive()
  @Max(100_000_000, { message: 'O valor máximo por operação é R$ 1.000.000,00' })
  amountCents!: number;
}
