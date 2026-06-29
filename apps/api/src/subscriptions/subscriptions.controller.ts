import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../auth/current-user.decorator';

class CreateSubOrderDto {
  @IsString()
  planId!: string;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  /** Sotib olish mumkin bo'lgan rejalar (tier bo'yicha guruhlangan) */
  @Get('plans')
  plans() {
    return this.subs.listPlans();
  }

  /** Joriy obuna holatim */
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.subs.getMySubscription(userId);
  }

  /** Obuna sotib olish: Order yaratib Payme checkout manzilini qaytaradi */
  @Post('order')
  order(@CurrentUser('id') userId: string, @Body() dto: CreateSubOrderDto) {
    return this.subs.createOrder(userId, dto.planId);
  }
}
