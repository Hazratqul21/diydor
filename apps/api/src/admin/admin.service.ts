import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from '../common/settings/app-settings.service';
import { PaymeConfigService } from '../payments/payme-config.service';
import { verifyPassword } from '../common/password';
import { encryptSecret, maskTail } from '../common/crypto';
import { UpdateConfigDto, UpdatePaymentConfigDto, UpsertPlanDto } from './dto/admin.dto';

const BRANDING_DIR = path.join(process.cwd(), 'uploads', 'branding');

const CONFIG_ID = 'singleton';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly settings: AppSettingsService,
    private readonly paymeConfig: PaymeConfigService,
  ) {}

  // ─────────────── Auth ───────────────

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.isActive || !verifyPassword(password, admin.passwordHash)) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }
    await this.prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    const token = await this.jwt.signAsync(
      { sub: admin.id, typ: 'admin', role: admin.role },
      { expiresIn: '12h' },
    );
    return {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  }

  // ─────────────── Dashboard ───────────────

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalUsers, verifiedUsers, payingUsers, newToday, totalMatches, openReports, paidOrders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.count({
          where: { subscriptionTier: { not: 'FREE' }, subscriptionUntil: { gt: now } },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.match.count({ where: { closedAt: null } }),
        this.prisma.report.count(),
        this.prisma.order.aggregate({ where: { state: 'PAID' }, _sum: { amount: true } }),
      ]);

    return {
      totalUsers,
      verifiedUsers,
      payingUsers,
      newToday,
      totalMatches,
      openReports,
      revenueSom: Math.round((paidOrders._sum.amount ?? 0) / 100),
    };
  }

  // ─────────────── Users ───────────────

  async listUsers(q?: string, page = 1, limit = 20) {
    const where: Prisma.UserWhereInput = q
      ? { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { photos: { take: 1, orderBy: { order: 'asc' } }, _count: { select: { reportsReceived: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map((u) => this.serialize(u)), total, page, limit };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        _count: { select: { reportsReceived: true, matchesAsUserA: true, matchesAsUserB: true } },
      },
    });
    if (!user) throw new NotFoundException('User topilmadi');
    return this.serialize(user);
  }

  setBan(id: string, banned: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isBanned: banned } }).then((u) => this.serialize(u));
  }

  setVerify(id: string, verified: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isVerified: verified } }).then((u) => this.serialize(u));
  }

  // ─────────────── Config (sozlamalar) ───────────────

  async getConfig() {
    return this.prisma.appConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID },
      update: {},
    });
  }

  async updateConfig(dto: UpdateConfigDto) {
    const cfg = await this.prisma.appConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, ...dto },
      update: { ...dto },
    });
    this.settings.invalidate(); // cache'ni yangilash — o'zgarish darhol kuchga kiradi
    return cfg;
  }

  /**
   * Welcome rasmini yuklash — base64 data URL diskka (uploads/branding) saqlanadi,
   * welcomeImageUrl yangilanadi. Admin xohlagancha o'zgartira oladi.
   */
  async uploadWelcomeImage(dataUrl: string) {
    const m = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl ?? '');
    if (!m) throw new BadRequestException('Rasm formati xato (PNG/JPG/WEBP data URL kutilyapti)');
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const buffer = Buffer.from(m[3], 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      throw new BadRequestException('Rasm hajmi 8MB dan oshmasin');
    }
    fs.mkdirSync(BRANDING_DIR, { recursive: true });
    const fileName = `welcome-${randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(BRANDING_DIR, fileName), buffer);
    const url = `/uploads/branding/${fileName}`;

    await this.prisma.appConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, welcomeImageUrl: url },
      update: { welcomeImageUrl: url },
    });
    this.settings.invalidate();
    return { welcomeImageUrl: url };
  }

  // ─────────────── To'lov rekvizitlari (Payme) ───────────────

  /** Payme config — kalitlar HECH QACHON ochiq qaytarilmaydi (faqat oxirgi 4 belgi). */
  async getPaymentConfig() {
    const row = await this.prisma.paymentConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID },
      update: {},
    });
    return {
      paymeMerchantId: row.paymeMerchantId,
      paymeEnv: row.paymeEnv,
      paymeCheckoutUrl: row.paymeCheckoutUrl,
      testKeySet: !!row.paymeKeyTestEnc,
      prodKeySet: !!row.paymeKeyProdEnc,
      testKeyTail: maskTail(row.paymeKeyTestEnc),
      prodKeyTail: maskTail(row.paymeKeyProdEnc),
    };
  }

  /** Payme config yangilash. Kalit faqat bo'sh bo'lmasa yangilanadi (shifrlanadi). */
  async updatePaymentConfig(dto: UpdatePaymentConfigDto) {
    const data: Record<string, unknown> = {};
    if (dto.paymeMerchantId !== undefined) data.paymeMerchantId = dto.paymeMerchantId;
    if (dto.paymeEnv !== undefined) data.paymeEnv = dto.paymeEnv;
    if (dto.paymeCheckoutUrl !== undefined) data.paymeCheckoutUrl = dto.paymeCheckoutUrl;
    if (dto.paymeKeyTest) data.paymeKeyTestEnc = encryptSecret(dto.paymeKeyTest);
    if (dto.paymeKeyProd) data.paymeKeyProdEnc = encryptSecret(dto.paymeKeyProd);

    await this.prisma.paymentConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, ...data },
      update: data,
    });
    this.paymeConfig.invalidate(); // cache yangilanadi — yangi kalit darhol kuchga kiradi
    return this.getPaymentConfig();
  }

  // ─────────────── Subscription plans ───────────────

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: [{ sortOrder: 'asc' }, { priceSom: 'asc' }] });
  }

  upsertPlan(dto: UpsertPlanDto) {
    return this.prisma.subscriptionPlan.upsert({
      where: { tier_period: { tier: dto.tier, period: dto.period } },
      create: dto,
      update: { priceSom: dto.priceSom, discountPercent: dto.discountPercent, active: dto.active, sortOrder: dto.sortOrder },
    });
  }

  async deletePlan(id: string) {
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { ok: true };
  }

  // ─────────────── To'lovlar ───────────────

  async listOrders(page = 1, limit = 30) {
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, username: true } },
          transactions: { select: { id: true, state: true, performTime: true } },
        },
      }),
      this.prisma.order.count(),
    ]);
    return { items, total, page, limit };
  }

  // ─────────────── Pul yechish so'rovlari ───────────────

  async listWithdrawals(status?: string, page = 1, limit = 30) {
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, firstName: true, username: true, gender: true } } },
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  /** Admin qo'lda to'ladi deb belgilaydi. */
  async markWithdrawalPaid(id: string) {
    return this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'PAID', processedAt: new Date() },
    });
  }

  /** Rad etiladi — mablag' foydalanuvchi hamyoniga qaytariladi. */
  async rejectWithdrawal(id: string, note?: string) {
    const req = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('So\'rov topilmadi');
    if (req.status !== 'PENDING') throw new NotFoundException('Bu so\'rov allaqachon ko\'rib chiqilgan');
    const [updated] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED', processedAt: new Date(), note: note ?? null },
      }),
      this.prisma.user.update({
        where: { id: req.userId },
        data: { walletBalance: { increment: req.amountSom } },
      }),
    ]);
    return updated;
  }

  // ─────────────── Xavfsizlik / shikoyatlar ───────────────

  async listReports(page = 1, limit = 30) {
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { id: true, firstName: true } },
          reported: { select: { id: true, firstName: true, isBanned: true } },
        },
      }),
      this.prisma.report.count(),
    ]);
    return { items, total, page, limit };
  }

  async resolveReport(id: string) {
    await this.prisma.report.delete({ where: { id } });
    return { ok: true };
  }

  // ─────────────── Chat boshqaruvi (moderatsiya) ───────────────

  /** Barcha suhbatlar — ikkala foydalanuvchi + oxirgi xabar + xabar soni. */
  async listChats(page = 1, limit = 30) {
    const sel = { id: true, firstName: true, username: true, gender: true };
    const [rows, total] = await Promise.all([
      this.prisma.match.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userA: { select: sel },
          userB: { select: sel },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.match.count(),
    ]);
    const items = rows.map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      closed: m.closedAt != null,
      userA: m.userA,
      userB: m.userB,
      messageCount: m._count.messages,
      lastMessage: m.messages[0] ?? null,
    }));
    return { items, total, page, limit };
  }

  /** Bitta suhbatning barcha xabarlari (moderatsiya uchun). */
  async getChatMessages(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        userA: { select: { id: true, firstName: true } },
        userB: { select: { id: true, firstName: true } },
      },
    });
    if (!match) throw new NotFoundException('Suhbat topilmadi');
    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });
    return { match: { id: match.id, userA: match.userA, userB: match.userB }, messages };
  }

  // ─────────────── Referal (promouterlar) ───────────────

  /** Barcha referal kodlar + statistika (qo'shilgan / tasdiqlangan userlar). */
  async listReferrals() {
    const codes = await this.prisma.referralCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } },
    });
    const verified = await this.prisma.user.groupBy({
      by: ['referralCodeId'],
      where: { referralCodeId: { not: null }, isVerified: true },
      _count: { _all: true },
    });
    const vMap = new Map(verified.map((v) => [v.referralCodeId, v._count._all]));

    const bot = process.env.TELEGRAM_BOT_USERNAME || 'diydorapp_bot';
    const appUrl = (process.env.APP_PUBLIC_URL || 'https://diydorapp.uz').replace(/\/$/, '');
    return codes.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      isActive: c.isActive,
      createdAt: c.createdAt,
      joined: c._count.users,
      verified: vMap.get(c.id) ?? 0,
      link: `https://t.me/${bot}?startapp=${c.code}`,
      webLink: `${appUrl}/?ref=${c.code}`,
    }));
  }

  /** Yangi referal kod: berilsa shu kod, aks holda tasodifiy 6 belgi. */
  async createReferral(name: string, code?: string) {
    const clean = (code ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let final = clean;
    if (final) {
      const exists = await this.prisma.referralCode.findUnique({ where: { code: final } });
      if (exists) throw new BadRequestException('Bu kod band. Boshqasini kiriting.');
    } else {
      // O'qishda adashtiradigan belgilarsiz (0/o, 1/l/i) tasodifiy kod
      const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
      do {
        final = Array.from(
          { length: 6 },
          () => alphabet[Math.floor(Math.random() * alphabet.length)],
        ).join('');
      } while (await this.prisma.referralCode.findUnique({ where: { code: final } }));
    }
    return this.prisma.referralCode.create({ data: { name: name.trim(), code: final } });
  }

  /** Kodni faol/nofaol qilish (nofaol kod yangi userga biriktirilmaydi). */
  async toggleReferral(id: string) {
    const rc = await this.prisma.referralCode.findUnique({ where: { id } });
    if (!rc) throw new NotFoundException('Referal topilmadi');
    return this.prisma.referralCode.update({
      where: { id },
      data: { isActive: !rc.isActive },
    });
  }

  /** Kodni o'chirish (userlardagi bog'lanish SetNull bo'ladi). */
  async deleteReferral(id: string) {
    try {
      await this.prisma.referralCode.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Referal topilmadi');
    }
    return { ok: true };
  }

  // ─────────────── Helper ───────────────

  private serialize(user: any) {
    const { passwordHash, ...rest } = user;
    return { ...rest, telegramId: user.telegramId?.toString() ?? null };
  }
}
