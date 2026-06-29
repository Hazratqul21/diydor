import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Gender, Prisma, SwipeAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../common/serialize-user';
import { AppSettingsService } from '../common/settings/app-settings.service';
import { TIER_RANK, effectiveTier, hasTierAtLeast, isSubscribed } from '../common/subscription.util';
import { ChatGateway } from '../matches/chat.gateway';
import { TelegramNotifyService } from '../notifications/telegram-notify.service';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
    private readonly chatGateway: ChatGateway,
    private readonly telegram: TelegramNotifyService,
  ) {}

  /** Svayp navbati — niyat/jins/seekingGender bo'yicha nomzodlar. */
  async getCandidates(meId: string, limit = 10, nearby = false) {
    const me = await this.prisma.user.findUnique({ where: { id: meId } });
    if (!me) throw new BadRequestException('User topilmadi');

    // "Yaqin atrofda" — shahar ma'lumoti yo'q bo'lsa hech kim mos kelmaydi
    if (nearby && !me.city) return [];

    const swiped = await this.prisma.swipe.findMany({
      where: { fromUserId: meId },
      select: { toUserId: true },
    });
    // Bloklanganlar (men bloklagan + meni bloklagan) — ikki tomonlama yashirish
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: meId }, { blockedId: meId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = blocks.map((b) => (b.blockerId === meId ? b.blockedId : b.blockerId));
    const excludeIds = [meId, ...swiped.map((s) => s.toUserId), ...blockedIds];

    const where: Prisma.UserWhereInput = {
      id: { notIn: excludeIds },
      isBanned: false,
      gender: { not: null },
      photos: { some: { moderationStatus: 'APPROVED' } }, // kamida bitta KO'RSATILADIGAN rasm
    };

    if (nearby) {
      where.city = me.city;
    }

    // Men kimni qidiraman
    if (me.seekingGender && me.seekingGender !== 'EVERYONE') {
      where.gender = me.seekingGender as Gender;
    }
    // Ular meni qidirishi (o'zaro afzallik)
    if (me.gender) {
      where.OR = [{ seekingGender: 'EVERYONE' }, { seekingGender: me.gender }];
    }

    // Prioritet saralash uchun kerakli darajada ko'proq nomzod olamiz
    const pool = await this.prisma.user.findMany({
      where,
      include: {
        photos: { where: { moderationStatus: 'APPROVED' }, orderBy: { order: 'asc' } },
        prompts: { orderBy: { order: 'asc' } },
      },
      take: Math.max(limit * 3, 30),
      orderBy: { lastActiveAt: 'desc' },
    });

    // Premium prioritet ("Profilingiz yuqorida"): yuqori tier obunachilar
    // navbatda oldinroq, keyin so'nggi faollik bo'yicha.
    return pool
      .sort(
        (a, b) =>
          TIER_RANK[effectiveTier(b)] - TIER_RANK[effectiveTier(a)] ||
          b.lastActiveAt.getTime() - a.lastActiveAt.getTime(),
      )
      .slice(0, limit)
      .map(serializeUser);
  }

  /** Svayp: LIKE/SUPERLIKE bo'lsa o'zaro yoqtirishni tekshirib match yaratadi. */
  async swipe(meId: string, toUserId: string, action: SwipeAction, message?: string) {
    if (toUserId === meId) throw new BadRequestException("O'zingizni svayp qila olmaysiz");

    // Paywall: obunasiz foydalanuvchilar uchun kunlik svayp va haftalik SuperLike limiti
    await this.enforceSwipeLimits(meId, action);

    // "Xabar yuborib tanishish" — faqat Platinum (yoki bepul-premium ayollar)
    const prematch = action !== SwipeAction.PASS && message?.trim() ? message.trim() : undefined;
    if (prematch) {
      const me = await this.prisma.user.findUnique({
        where: { id: meId },
        select: { subscriptionTier: true, subscriptionUntil: true, gender: true },
      });
      const canMessage = !!me && (me.gender === 'FEMALE' || hasTierAtLeast(me, 'PLATINUM'));
      if (!canMessage) {
        throw new ForbiddenException({
          code: 'PREMATCH_MESSAGE_LOCKED',
          message: 'Tanishishdan oldin xabar yuborish — Platinum imkoniyati.',
        });
      }
    }

    await this.prisma.swipe.upsert({
      where: { fromUserId_toUserId: { fromUserId: meId, toUserId } },
      create: { fromUserId: meId, toUserId, action, message: prematch },
      update: { action, message: prematch },
    });

    if (action === SwipeAction.PASS) {
      return { match: false as const };
    }

    const reciprocal = await this.prisma.swipe.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: meId } },
    });

    const liked =
      reciprocal &&
      (reciprocal.action === SwipeAction.LIKE || reciprocal.action === SwipeAction.SUPERLIKE);

    if (!liked) {
      return { match: false as const };
    }

    // Barqaror tartib: userAId < userBId
    const [userAId, userBId] = [meId, toUserId].sort();
    const match = await this.prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: { closedAt: null },
      include: {
        userA: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
        userB: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
      },
    });

    // Pre-match xabarlar (Platinum) — yangi suhbat bo'sh bo'lsa chatga ko'chiramiz
    const msgCount = await this.prisma.message.count({ where: { matchId: match.id } });
    if (msgCount === 0) {
      const seeds: { matchId: string; senderId: string; content: string }[] = [];
      if (reciprocal?.message) seeds.push({ matchId: match.id, senderId: toUserId, content: reciprocal.message });
      if (prematch) seeds.push({ matchId: match.id, senderId: meId, content: prematch });
      if (seeds.length) {
        await this.prisma.message.createMany({ data: seeds.map((s) => ({ ...s, type: 'TEXT' as const })) });
      }
    }

    const other = match.userAId === meId ? match.userB : match.userA;
    const me = match.userAId === meId ? match.userA : match.userB;

    // Boshqa foydalanuvchini yangi match haqida xabardor qilamiz (real-time + push)
    this.chatGateway.notifyNewMatch(toUserId, {
      matchId: match.id,
      user: serializeUser(me),
    });
    void (async () => {
      if (!(await this.chatGateway.isOnline(toUserId))) {
        await this.telegram.sendToUser(toUserId, `🎉 Yangi moslik! Kimdir sizni yoqtirdi — kim ekanini ko'ring`);
      }
    })();

    return { match: true as const, matchId: match.id, user: serializeUser(other) };
  }

  /**
   * "Sizni kim yoqtirdi" — Gold-gate. Faqat GOLD+ obunachilar identifikatsiyani
   * (rasm/profil) ko'radi. Obunasiz/Plus uchun faqat son qaytariladi (locked).
   */
  async whoLikedMe(meId: string) {
    const me = await this.prisma.user.findUnique({
      where: { id: meId },
      select: { subscriptionTier: true, subscriptionUntil: true, gender: true },
    });
    if (!me) throw new BadRequestException('User topilmadi');

    const mySwipes = await this.prisma.swipe.findMany({
      where: { fromUserId: meId },
      select: { toUserId: true },
    });
    const swipedIds = mySwipes.map((s) => s.toUserId);

    const likes = await this.prisma.swipe.findMany({
      where: {
        toUserId: meId,
        action: { in: [SwipeAction.LIKE, SwipeAction.SUPERLIKE] },
        fromUserId: { notIn: swipedIds },
      },
      include: {
        fromUser: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ayollar bepul premium (to'lov olinmaydi); erkaklar uchun Gold-gate
    const freeAccess = me.gender === 'FEMALE' || hasTierAtLeast(me, 'GOLD');
    if (!freeAccess) {
      return { locked: true, count: likes.length, items: [] as unknown[] };
    }

    return {
      locked: false,
      count: likes.length,
      items: likes.map((l) => ({
        swipedAt: l.createdAt,
        superLike: l.action === SwipeAction.SUPERLIKE,
        message: l.message ?? null, // Platinum pre-match xabar (bo'lsa)
        user: serializeUser(l.fromUser),
      })),
    };
  }

  /**
   * Obunasiz foydalanuvchilar uchun svayp limitlari (AppConfig'dan).
   * Obunachilarga (har qanday pulli tier) cheklov yo'q.
   */
  private async enforceSwipeLimits(meId: string, action: SwipeAction) {
    if (action === SwipeAction.PASS) return; // PASS cheksiz

    const me = await this.prisma.user.findUnique({
      where: { id: meId },
      select: { subscriptionTier: true, subscriptionUntil: true, gender: true },
    });
    // Ayollardan to'lov olinmaydi -> cheksiz (bepul premium); erkaklar limitга tushadi
    if (!me || me.gender === 'FEMALE' || isSubscribed(me)) return;

    const cfg = await this.settings.get();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const likesToday = await this.prisma.swipe.count({
      where: {
        fromUserId: meId,
        action: { in: [SwipeAction.LIKE, SwipeAction.SUPERLIKE] },
        createdAt: { gte: startOfDay },
      },
    });
    if (likesToday >= cfg.freeSwipesPerDay) {
      throw new ForbiddenException({
        code: 'SWIPE_LIMIT',
        message: `Bugungi ${cfg.freeSwipesPerDay} ta bepul yoqtirish tugadi. Cheksiz yoqtirish uchun obuna oling.`,
      });
    }

    if (action === SwipeAction.SUPERLIKE) {
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // dushanba
      const superThisWeek = await this.prisma.swipe.count({
        where: { fromUserId: meId, action: SwipeAction.SUPERLIKE, createdAt: { gte: startOfWeek } },
      });
      if (superThisWeek >= cfg.freeSuperLikesPerWeek) {
        throw new ForbiddenException({
          code: 'SUPERLIKE_LIMIT',
          message: `Haftalik ${cfg.freeSuperLikesPerWeek} ta SuperLike tugadi. Obuna bilan ko'proq oling.`,
        });
      }
    }
  }
}
