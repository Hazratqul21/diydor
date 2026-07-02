import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Telegram bot integratsiyasi:
 *  • push-bildirishnoma (ilova yopiq bo'lganda re-engagement uchun)
 *  • kiruvchi update'lar (webhook) — /start ga xush kelibsiz + mini-app tugmasi
 * Faqat telegramId mavjud foydalanuvchilarga (va bot token sozlangan bo'lsa).
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

  /** Webhook so'rovini tekshirish uchun maxfiy kalit (X-Telegram-Bot-Api-Secret-Token). */
  get webhookSecret(): string {
    return this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '';
  }

  /** Mini-app'ni Telegram ichida ochadigan tugma (auto-login initData bilan).
   *  ref berilsa URL'ga qo'shiladi — /start <kod> orqali kelgan referal
   *  atributsiyasi mini-app ochilganda ham saqlanadi. */
  private appButton(ref?: string) {
    const url = ref ? `${this.appUrl}/?ref=${encodeURIComponent(ref)}` : this.appUrl;
    return {
      inline_keyboard: [[{ text: '💫 Diydorni ochish', web_app: { url } }]],
    };
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
          reply_markup: this.appButton(),
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Telegram sendMessage status ${res.status}`);
      }
    } catch (e) {
      this.logger.warn(`Telegram yuborish xato: ${(e as Error).message}`);
    }
  }

  // ─────────── Webhook (kiruvchi update'lar) ───────────

  /** Telegram webhook update'ini qayta ishlaydi (/start -> xush kelibsiz). */
  async handleUpdate(update: any): Promise<void> {
    try {
      const msg = update?.message;
      const text: string = msg?.text ?? '';
      const chatId = msg?.chat?.id;
      if (!chatId) return;

      // /start yoki har qanday birinchi murojaat -> xush kelibsiz + mini-app tugmasi
      if (text.startsWith('/start') || text === '') {
        // "/start ref_kod" — deep-link payload (referal)
        const payload = text.split(/\s+/)[1]?.trim();
        await this.sendWelcome(chatId, msg?.from?.first_name, payload);
      }
    } catch (e) {
      this.logger.warn(`handleUpdate xato: ${(e as Error).message}`);
    }
  }

  private async sendWelcome(chatId: number | string, firstName?: string, ref?: string): Promise<void> {
    if (!this.token) return;
    const name = firstName ? `, <b>${escapeHtml(firstName)}</b>` : '';
    const text =
      `💛 <b>Diydor</b>ga xush kelibsiz${name}!\n\n` +
      `Qalblar uchrashadigan joy — tanishing, suhbatlashing va yaqin insoningizni toping.\n\n` +
      `Boshlash uchun pastdagi tugmani bosing 👇`;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: this.appButton(ref),
        }),
      });
      if (!res.ok) {
        this.logger.warn(`sendWelcome status ${res.status}: ${await res.text().catch(() => '')}`);
      }
    } catch (e) {
      this.logger.warn(`sendWelcome xato: ${(e as Error).message}`);
    }
  }
}

/** Telegram HTML parse_mode uchun minimal escaping. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
