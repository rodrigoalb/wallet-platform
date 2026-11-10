import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
