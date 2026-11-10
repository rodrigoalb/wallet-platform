import { ApiProperty } from '@nestjs/swagger';
import { PlayerResponse } from './player.response';

export class PlayerPageResponse {
  @ApiProperty({ type: [PlayerResponse] }) items!: PlayerResponse[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
