import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { verifyTelegramInitData, TelegramUser } from './telegram.util';
import { JwtPayload } from './jwt.strategy';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly sms: SmsService,
  ) {}

  // ─────────────── Telefon + OTP (Flutter/standalone uchun) ───────────────

  private normalizePhone(phone: string): string {
    const d = (phone || '').replace(/\D/g, '');
    if (d.length < 9) throw new BadRequestException('Telefon raqami noto‘g‘ri');
    // O'zbekiston formatiga keltiramiz: +998XXXXXXXXX
    return d.startsWith('998') ? `+${d}` : `+998${d.slice(-9)}`;
  }

  /** OTP so'rovi: kod yaratiladi va SMS yuboriladi (dev'da logga). */
  async requestPhoneOtp(phone: string) {
    const normalized = this.normalizePhone(phone);
    if (!(await this.otp.canRequest(normalized))) {
      throw new BadRequestException('Biroz kuting va qayta urinib ko‘ring');
    }
    const code = await this.otp.generate(normalized);
    await this.sms.send(normalized, `Diydor tasdiqlash kodi: ${code}`);
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    // Productionda kod hech qachon qaytarilmaydi; dev'da test qulayligi uchun
    return { ok: true, ...(isProd || this.sms.configured ? {} : { devCode: code }) };
  }

  /** OTP tasdiqlash: user telefon bo'yicha upsert qilinadi, JWT qaytariladi. */
  async verifyPhoneOtp(phone: string, code: string) {
    const normalized = this.normalizePhone(phone);
    const ok = await this.otp.verify(normalized, code);
    if (!ok) throw new UnauthorizedException('Kod noto‘g‘ri yoki muddati tugagan');

    const user = await this.prisma.user.upsert({
      where: { phone: normalized },
      update: { lastActiveAt: new Date() },
      create: { phone: normalized, firstName: 'Foydalanuvchi' },
    });
    if (user.isBanned) throw new UnauthorizedException('Hisob bloklangan');

    const token = await this.signToken(user.id, user.telegramId?.toString() ?? '');
    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        onboardingStep: user.onboardingStep,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * TMA initData orqali kirish: imzo tekshiriladi, user upsert qilinadi,
   * JWT qaytariladi.
   */
  async loginWithTelegram(initData: string) {
    const tgUser = this.resolveTelegramUser(initData);

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tgUser.id) },
      update: {
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        languageCode: tgUser.language_code ?? 'uz',
        photoUrl: tgUser.photo_url,
        lastActiveAt: new Date(),
      },
      create: {
        telegramId: BigInt(tgUser.id),
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        languageCode: tgUser.language_code ?? 'uz',
        photoUrl: tgUser.photo_url,
      },
    });

    if (user.isBanned) {
      throw new UnauthorizedException('Hisob bloklangan');
    }

    const token = await this.signToken(user.id, user.telegramId?.toString() ?? '');

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        onboardingStep: user.onboardingStep,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Mehmon (anonim) kirish — mustaqil ilova uchun. Login ekranisiz yangi user
   * yaratadi va JWT qaytaradi. Keyinchalik telefon OTP bilan bog'lanadi.
   */
  async loginAsGuest(firstName?: string) {
    const user = await this.prisma.user.create({
      data: {
        firstName: firstName?.trim() || 'Mehmon',
      },
    });

    const token = await this.signToken(user.id, '');

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        onboardingStep: user.onboardingStep,
        isVerified: user.isVerified,
      },
    };
  }

  private resolveTelegramUser(initData: string): TelegramUser {
    // XAVFSIZLIK: dev bypass PRODUCTIONDA hech qachon ishlamaydi (env qiymatidan qat'i nazar)
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const devBypass = !isProd && this.config.get<string>('AUTH_DEV_BYPASS') === 'true';
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';

    if (devBypass) {
      // FAQAT lokal test: initData ni JSON sifatida qabul qiladi (imzosiz).
      // { "id": 123, "first_name": "Test" }
      this.logger.warn('AUTH_DEV_BYPASS yoqilgan — initData imzosi TEKSHIRILMAYDI!');
      try {
        const parsed = JSON.parse(initData);
        if (!parsed.id || !parsed.first_name) {
          throw new Error('id va first_name kerak');
        }
        return parsed as TelegramUser;
      } catch (e) {
        throw new UnauthorizedException(`Dev bypass payload xato: ${(e as Error).message}`);
      }
    }

    try {
      return verifyTelegramInitData(initData, botToken).user;
    } catch (e) {
      throw new UnauthorizedException((e as Error).message);
    }
  }

  private signToken(userId: string, telegramId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, tg: telegramId };
    return this.jwt.signAsync(payload);
  }
}
