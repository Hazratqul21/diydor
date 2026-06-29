import { SubTier } from '@prisma/client';

/** Tier darajalari (gate tekshiruvlari uchun): FREE < PLUS < GOLD < PLATINUM */
export const TIER_RANK: Record<SubTier, number> = {
  FREE: 0,
  PLUS: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export interface SubLike {
  subscriptionTier: SubTier;
  subscriptionUntil: Date | null;
}

/** Obuna hozir faolmi (tier FREE emas va muddati tugamagan). */
export function isSubscribed(u: SubLike): boolean {
  return u.subscriptionTier !== 'FREE' && !!u.subscriptionUntil && u.subscriptionUntil > new Date();
}

/** Foydalanuvchining amaldagi tier'i (muddati tugagan bo'lsa FREE). */
export function effectiveTier(u: SubLike): SubTier {
  return isSubscribed(u) ? u.subscriptionTier : 'FREE';
}

/** Foydalanuvchi kerakli tier yoki undan yuqorimi (masalan Gold-gate). */
export function hasTierAtLeast(u: SubLike, required: SubTier): boolean {
  return TIER_RANK[effectiveTier(u)] >= TIER_RANK[required];
}
