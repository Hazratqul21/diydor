import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomInt } from 'node:crypto';

/**
 * Telefon OTP kodlarini Redis'da (TTL bilan) saqlaydi va tekshiradi.
 * Redis bo'lmasa OTP ishlamaydi (verify har doim false).
 */
@Injectable()
export class OtpService {
  private redis: Redis | null = null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (url) this.redis = new Redis(url);
  }

  private key(phone: string) {
    return `otp:code:${phone}`;
  }

  /** 6 xonali kod yaratadi va 5 daqiqaga saqlaydi. */
  async generate(phone: string): Promise<string> {
    const code = String(randomInt(100000, 1000000));
    if (this.redis) await this.redis.set(this.key(phone), code, 'EX', 300);
    return code;
  }

  /** Kodni tekshiradi; to'g'ri bo'lsa o'chiradi (bir martalik). */
  async verify(phone: string, code: string): Promise<boolean> {
    if (!this.redis) return false;
    const stored = await this.redis.get(this.key(phone));
    if (!stored || stored !== code) return false;
    await this.redis.del(this.key(phone));
    return true;
  }

  /** Rate-limit: bitta raqamga 60 soniyada 1 marta so'rov. */
  async canRequest(phone: string): Promise<boolean> {
    if (!this.redis) return true;
    const res = await this.redis.set(`otp:rl:${phone}`, '1', 'EX', 60, 'NX');
    return res === 'OK';
  }
}
