import { Body, Controller, Inject, NotFoundException, Post } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { PlayerTokenService } from '../auth/player-token.service';
import { NOTIFICATION_CONFIG, NotificationConfig } from '../config';

class IssueTokenDto {
  @IsUUID()
  playerId!: string;
}

/**
 * Gera token de teste para a página de demonstração. Em um sistema real o
 * token viria do serviço de login; aqui o endpoint só existe com
 * ENABLE_DEV_TOKENS=true (ligado apenas no docker-compose local).
 */
@Controller('dev/tokens')
export class DevTokensController {
  constructor(
    private readonly tokens: PlayerTokenService,
    @Inject(NOTIFICATION_CONFIG) private readonly config: NotificationConfig,
  ) {}

  @Post()
  issue(@Body() dto: IssueTokenDto): { token: string; expiresInSeconds: number } {
    if (!this.config.enableDevTokens) {
      throw new NotFoundException();
    }
    return this.tokens.issue(dto.playerId);
  }
}
