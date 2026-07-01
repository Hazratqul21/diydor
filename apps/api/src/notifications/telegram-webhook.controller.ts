import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TelegramNotifyService } from './telegram-notify.service';

/**
 * Telegram bot webhook. Bot API bu manzilga update'larni yuboradi
 * (setWebhook bilan ro'yxatdan o'tkaziladi). @Public — JWT talab qilinmaydi,
 * o'rniga maxfiy kalit (secret_token) sarlavhasi tekshiriladi.
 */
@Controller('telegram')
export class TelegramWebhookController {
  constructor(private readonly telegram: TelegramNotifyService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ): Promise<{ ok: boolean }> {
    const expected = this.telegram.webhookSecret;
    // Secret sozlangan bo'lsa — mos kelmasa jim rad etamiz (200, lekin ishlamaymiz)
    if (expected && secret !== expected) {
      return { ok: true };
    }
    await this.telegram.handleUpdate(update);
    return { ok: true };
  }
}
