import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret } from '../common/crypto';

const CONFIG_ID = 'singleton';
const TTL_MS = 30_000;

export interface ResolvedPaymeConfig {
  merchantId: string;
  env: string;
  checkoutUrl: string;
  key: string; // joriy muhitga mos (test/prod) ochiq kalit
}

/**
 * Payme rekvizitlarini hal qiladi: avval bazadagi PaymentConfig (admin paneldan),
 * bo'sh bo'lsa .env'ga fallback. Kalit DB'da shifrlangan — bu yerda ochiladi.
 * Natija 30s cache'lanadi (har so'rovda DB o'qimaslik uchun).
 */
@Injectable()
export class PaymeConfigService {
  private cache: ResolvedPaymeConfig | null = null;
  private cachedAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async get(): Promise<ResolvedPaymeConfig> {
    const now = Date.now();
    if (this.cache && now - this.cachedAt < TTL_MS) return this.cache;

    const row = await this.prisma.paymentConfig.findUnique({ where: { id: CONFIG_ID } });
    const env = row?.paymeEnv || this.config.get<string>('PAYME_ENV') || 'test';

    // Kalit: DB'dan (shifrlangan), bo'lmasa .env'dan
    const dbKey = env === 'prod' ? decryptSecret(row?.paymeKeyProdEnc) : decryptSecret(row?.paymeKeyTestEnc);
    const envKey =
      (env === 'prod' ? this.config.get<string>('PAYME_KEY') : this.config.get<string>('PAYME_KEY_TEST')) ?? '';

    const resolved: ResolvedPaymeConfig = {
      merchantId: row?.paymeMerchantId || this.config.get<string>('PAYME_MERCHANT_ID') || '',
      env,
      checkoutUrl:
        row?.paymeCheckoutUrl ||
        this.config.get<string>('PAYME_CHECKOUT_URL') ||
        'https://checkout.paycom.uz',
      key: dbKey || envKey,
    };

    this.cache = resolved;
    this.cachedAt = now;
    return resolved;
  }

  invalidate(): void {
    this.cache = null;
    this.cachedAt = 0;
  }
}
