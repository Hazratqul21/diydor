import { Body, Controller, Get, Post } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { SendGiftDto, PurchaseCoinsDto, WithdrawDto } from './dto/economy.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class EconomyController {
  constructor(private readonly economy: EconomyService) {}

  @Get('gifts/catalog')
  catalog() {
    return this.economy.getGiftCatalog();
  }

  @Post('gifts/send')
  sendGift(@CurrentUser('id') userId: string, @Body() dto: SendGiftDto) {
    return this.economy.sendGift(userId, dto.matchId, dto.giftKey);
  }

  @Get('coins/packages')
  packages() {
    return this.economy.getCoinPackages();
  }

  /** Haqiqiy to'lov: Order yaratib, Payme checkout manzilini qaytaradi */
  @Post('coins/order')
  createOrder(@CurrentUser('id') userId: string, @Body() dto: PurchaseCoinsDto) {
    return this.economy.createCoinOrder(userId, dto.packageId);
  }

  /** DEV: to'lovsiz tanga kreditlash (faqat lokal test) */
  @Post('coins/purchase')
  purchase(@CurrentUser('id') userId: string, @Body() dto: PurchaseCoinsDto) {
    return this.economy.purchaseCoins(userId, dto.packageId);
  }

  @Get('wallet')
  wallet(@CurrentUser('id') userId: string) {
    return this.economy.getWallet(userId);
  }

  @Post('wallet/withdraw')
  withdraw(@CurrentUser('id') userId: string, @Body() dto: WithdrawDto) {
    return this.economy.withdraw(userId, dto.cardNumber, dto.amount);
  }
}
