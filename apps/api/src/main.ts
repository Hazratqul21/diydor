import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import helmet from 'helmet';
import { AppModule } from './app.module';

// BigInt'ni JSON'da xavfsiz serializatsiya qilish (telegramId, Payme vaqtlari)
// Telegram id va ms vaqtlar < 2^53, shuning uchun Number aniqligi yetarli.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Xavfsizlik sarlavhalari (Helmet). Rasmlar cross-origin yuklanishi uchun yumshatilgan.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // Productionda zaif maxfiy kalitlardan ogohlantirish
  if (isProd) {
    const secret = process.env.JWT_SECRET ?? '';
    if (!secret || secret.includes('dev') || secret.length < 24) {
      Logger.error('XAVFLI: JWT_SECRET zaif yoki standart. Kuchli random qiymat o\'rnating!', 'Security');
    }
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      Logger.warn('AUTH_DEV_BYPASS=true productionda e\'tiborsiz qoldiriladi (kod darajasida o\'chiq).', 'Security');
    }
  }

  // Yuklangan rasmlarni statik tarqatish
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Katta base64 rasm payloadlari uchun limit
  app.useBodyParser('json', { limit: '12mb' });

  // Global validatsiya — barcha DTO'lar class-validator orqali tekshiriladi
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da bo'lmagan maydonlarni tashlab yuboradi
      transform: true, // payload'ni DTO tipiga aylantiradi
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  // CORS: productionda faqat CORS_ORIGINS (vergul bilan) ruxsat etiladi; dev'da hammasi
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: isProd ? (corsOrigins.length ? corsOrigins : false) : true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Diydor API ishga tushdi: http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
