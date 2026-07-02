import { Body, Controller, Get, Param, Post, Put, Delete } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.matches.listMatches(userId);
  }

  @Get(':id/messages')
  messages(@CurrentUser('id') userId: string, @Param('id') matchId: string) {
    return this.matches.getMessages(userId, matchId);
  }

  @Post(':id/messages')
  send(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.matches.sendMessage(userId, matchId, dto.content, dto.type);
  }

  @Post(':id/image')
  image(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Body() body: { dataUrl: string },
  ) {
    return this.matches.sendImage(userId, matchId, body.dataUrl);
  }

  @Put(':id/messages/:messageId')
  updateMessage(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Param('messageId') messageId: string,
    @Body() body: { content: string },
  ) {
    return this.matches.updateMessage(userId, matchId, messageId, body.content);
  }

  @Delete(':id/messages/:messageId')
  deleteMessage(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.matches.deleteMessage(userId, matchId, messageId);
  }
}
