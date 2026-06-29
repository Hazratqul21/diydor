import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { SwipeDto } from './dto/swipe.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('discovery')
  candidates(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('nearby') nearby?: string,
  ) {
    return this.discovery.getCandidates(userId, limit ? Number(limit) : 10, nearby === 'true');
  }

  @Post('swipes')
  swipe(@CurrentUser('id') userId: string, @Body() dto: SwipeDto) {
    return this.discovery.swipe(userId, dto.toUserId, dto.action, dto.message);
  }

  @Get('likes-you')
  whoLikedMe(@CurrentUser('id') userId: string) {
    return this.discovery.whoLikedMe(userId);
  }
}
