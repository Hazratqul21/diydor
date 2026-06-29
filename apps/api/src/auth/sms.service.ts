import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS yuborish. Eskiz.uz (O'zbekiston) integratsiyasi.
 * ESKIZ_EMAIL/ESKIZ_PASSWORD sozlanmagan bo'lsa — DEV rejimi (faqat logga yozadi).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger('SMS');
  private token: string | null = null;

  constructor(private readonly config: ConfigService) {}

  private get email() {
    return this.config.get<string>('ESKIZ_EMAIL');
  }
  private get password() {
    return this.config.get<string>('ESKIZ_PASSWORD');
  }
  get configured(): boolean {
    return !!(this.email && this.password);
  }

  async send(phone: string, text: string): Promise<void> {
    if (!this.configured) {
      this.logger.warn(`[DEV SMS] ${phone}: ${text}`);
      return;
    }
    try {
      const token = await this.getToken();
      const fd = new FormData();
      fd.append('mobile_phone', phone.replace(/\D/g, ''));
      fd.append('message', text);
      fd.append('from', this.config.get<string>('ESKIZ_FROM') ?? '4546');
      const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd as any,
      });
      if (!res.ok) {
        this.token = null; // token eskirgan bo'lishi mumkin — keyingi safar yangilaymiz
        this.logger.warn(`Eskiz SMS status ${res.status}`);
      }
    } catch (e) {
      this.logger.error(`SMS yuborish xato: ${(e as Error).message}`);
    }
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const fd = new FormData();
    fd.append('email', this.email!);
    fd.append('password', this.password!);
    const res = await fetch('https://notify.eskiz.uz/api/auth/login', { method: 'POST', body: fd as any });
    const data = (await res.json()) as { data?: { token?: string } };
    this.token = data?.data?.token ?? null;
    if (!this.token) throw new Error('Eskiz token olinmadi');
    return this.token;
  }
}
