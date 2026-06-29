import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Telegram bot orqali push-bildirishnoma yuboradi (ilova yopiq bo'lganda
 * re-engagement uchun). Faqat telegramId mavjud foydalanuvchilarga.
 */
@Injectable()
export class TelegramNotifyService {
  private readonly logger = new Logger('TelegramNotify');

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get token(): string {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
  }

  private get appUrl(): string {
    return this.config.get<string>('APP_PUBLIC_URL') ?? 'https://diydorapp.uz';
  }

  /** userId bo'yicha telegramId topib, Telegram xabar yuboradi (bo'lmasa jim o'tadi). */
  async sendToUser(userId: string, text: string): Promise<void> {
    if (!this.token) return;
    try {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });
      if (!u?.telegramId) return;
      await this.send(u.telegramId.toString(), text);
    } catch (e) {
      this.logger.warn(`sendToUser xato: ${(e as Error).message}`);
    }
  }

  private async send(chatId: string, text: string): Promise<void> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          // url-tugma har doim yaroqli (web_app domeni sozlanmagan bo'lsa ham buzilmaydi)
          reply_markup: { inline_keyboard: [[{ text: '💬 Diydorni ochish', url: this.appUrl }]] },
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram sendMessage status ${res.status}`);
      }
    } catch (e) {
      this.logger.warn(`Telegram yuborish xato: ${(e as Error).message}`);
    }
  }
}
