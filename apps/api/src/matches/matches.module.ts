import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';

// ChatGateway endi global NotificationsModule'da provayd qilinadi.
@Module({
  providers: [MatchesService],
  controllers: [MatchesController],
})
export class MatchesModule {}
