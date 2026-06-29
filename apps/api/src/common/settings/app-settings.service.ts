import { Injectable } from '@nestjs/common';
import { AppConfig } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CONFIG_ID = 'singleton';
const TTL_MS = 30_000;

/**
 * AppConfig singletonni o'qiydigan markaziy servis (cache bilan).
 * Admin paneldagi sozlamalar (svayp limiti, tanga qiymati, sovg'a ulushi,
 * minimal yechish) shu yerdan butun ilovaga tarqaladi.
 */
@Injectable()
export class AppSettingsService {
  private cache: AppConfig | null = null;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** Joriy sozlamalar (yo'q bo'lsa default qiymatlar bilan yaratiladi). */
  async get(): Promise<AppConfig> {
    const now = Date.now();
    if (this.cache && now - this.cachedAt < TTL_MS) return this.cache;

    const cfg = await this.prisma.appConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID },
      update: {},
    });
    this.cache = cfg;
    this.cachedAt = now;
    return cfg;
  }

  /** Admin sozlamani o'zgartirgach cache'ni tozalash uchun. */
  invalidate(): void {
    this.cache = null;
    this.cachedAt = 0;
  }
}
