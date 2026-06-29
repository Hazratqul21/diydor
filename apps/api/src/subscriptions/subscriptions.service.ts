import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubPeriod, SubTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymeService } from '../payments/payme.service';

/** Davr -> kun soni (obuna muddatini hisoblash uchun). */
export const PERIOD_DAYS: Record<SubPeriod, number> = {
  WEEK: 7,
  MONTH: 30,
  YEAR: 365,
};

const TIER_LABEL: Record<SubTier, string> = {
  FREE: 'Bepul',
  PLUS: 'Plus',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payme: PaymeService,
  ) {}

  /** Foydalanuvchiga ko'rsatiladigan faol rejalar (tier bo'yicha guruhlangan). */
  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { priceSom: 'asc' }],
    });

    const tiers: SubTier[] = ['PLUS', 'GOLD', 'PLATINUM'];
    return tiers
      .map((tier) => ({
        tier,
        label: TIER_LABEL[tier],
        periods: plans
          .filter((p) => p.tier === tier)
          .map((p) => ({
            id: p.id,
            period: p.period,
            priceSom: p.priceSom,
            discountPercent: p.discountPercent,
          })),
      }))
      .filter((t) => t.periods.length > 0);
  }

  /** Joriy obuna holati. */
  async getMySubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionUntil: true, trialEndsAt: true, gender: true },
    });
    if (!user) throw new NotFoundException('User topilmadi');
    // Ayollar bepul to'liq kirish (to'lov olinmaydi)
    if (user.gender === 'FEMALE') {
      return { tier: 'PLATINUM', until: null, trialEndsAt: null, freeForWomen: true };
    }
    const now = new Date();
    const isActive =
      user.subscriptionTier !== 'FREE' && !!user.subscriptionUntil && user.subscriptionUntil > now;
    return {
      tier: isActive ? user.subscriptionTier : 'FREE',
      until: isActive ? user.subscriptionUntil : null,
      trialEndsAt: user.trialEndsAt,
      freeForWomen: false,
    };
  }

  /**
   * Obuna sotib olish uchun Order yaratadi va Payme checkout manzilini qaytaradi.
   * To'lov muvaffaqiyatli o'tgach (Payme Perform) obuna faollashadi.
   */
  async createOrder(userId: string, planId: string) {
    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { gender: true } });
    if (buyer?.gender === 'FEMALE') {
      throw new BadRequestException('Ayollar uchun barcha imkoniyatlar bepul — obuna shart emas');
    }
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) throw new BadRequestException('Reja topilmadi');

    const price = Math.round(plan.priceSom * (1 - plan.discountPercent / 100));

    const order = await this.prisma.order.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        planId: plan.id,
        subTier: plan.tier,
        subPeriod: plan.period,
        coins: 0,
        amount: price * 100, // so'm -> tiyin
        state: 'PENDING',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      priceSom: price,
      tier: plan.tier,
      period: plan.period,
      checkoutUrl: await this.payme.buildCheckoutUrl(order.id, order.amount),
    };
  }
}
