import { ApiProperty } from '@nestjs/swagger';
import { Player } from '../../domain/player.entity';

/** Formato de saída da API. Separar do domínio evita vazar campos internos. */
export class PlayerResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty() createdAt!: string;

  static from(player: Player): PlayerResponse {
    return {
      id: player.id,
      name: player.name,
      email: player.email,
      createdAt: player.createdAt.toISOString(),
    };
  }
}
