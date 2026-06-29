import { apiFetch } from './api';

const ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '');

/** Rasm URL'ini hal qiladi: tashqi (http) bo'lsa o'zicha, /uploads bo'lsa API origin bilan. */
export function photoUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return ORIGIN + url;
}

/** Ommaviy brending (Welcome ekrani — admin paneldan boshqariladi). */
export interface PublicConfig {
  welcomeImageUrl: string | null;
  welcomeTitle: string | null;
  welcomeSubtitle: string | null;
}

export function getPublicConfig(): Promise<PublicConfig> {
  return apiFetch<PublicConfig>('/config/public');
}

export type SwipeAction = 'LIKE' | 'PASS' | 'SUPERLIKE';

export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface Profile {
  id: string;
  firstName: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  intent: 'SERIOUS' | 'FRIENDSHIP' | 'UNSURE' | null;
  bio: string | null;
  interests: string[];
  city: string | null;
  isVerified: boolean;
  photos: Photo[];
}

export interface SwipeResult {
  match: boolean;
  matchId?: string;
  user?: Profile;
}

export interface MatchSummary {
  matchId: string;
  createdAt: string;
  user: Profile;
  lastMessage: Message | null;
  unread: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'GIFT' | 'SYSTEM';
  content: string;
  readAt: string | null;
  createdAt: string;
}

// ── Discovery ───────────────────────────────────────────────
export const getDiscovery = (limit = 10, nearby = false) =>
  apiFetch<Profile[]>(`/discovery?limit=${limit}&nearby=${nearby}`);

export const getProfile = (id: string) => apiFetch<Profile>(`/users/${id}`);

export const swipe = (toUserId: string, action: SwipeAction) =>
  apiFetch<SwipeResult>('/swipes', {
    method: 'POST',
    body: JSON.stringify({ toUserId, action }),
  });

export interface WhoLikedMe {
  locked: boolean;
  count: number;
  items: { superLike: boolean; user: Profile; swipedAt: string }[];
}
export const whoLikedMe = () => apiFetch<WhoLikedMe>('/likes-you');

// ── Photos ──────────────────────────────────────────────────
export const getPhotos = () => apiFetch<Photo[]>('/photos');
export const uploadPhoto = (dataUrl: string) =>
  apiFetch<Photo>('/photos', { method: 'POST', body: JSON.stringify({ dataUrl }) });
export const deletePhoto = (id: string) =>
  apiFetch<{ ok: boolean }>(`/photos/${id}`, { method: 'DELETE' });

// ── Verify (stub) ───────────────────────────────────────────
export const verifySelfie = (file: Blob) => {
  const body = new FormData();
  body.append('file', file, 'selfie.jpg');
  return apiFetch('/users/me/verify', { method: 'POST', body });
};

// ── Xavfsizlik: shikoyat / bloklash ─────────────────────────
export const reportUser = (reportedId: string, reason: string, details?: string) =>
  apiFetch<{ ok: boolean }>('/reports', {
    method: 'POST',
    body: JSON.stringify({ reportedId, reason, details }),
  });
export const blockUser = (blockedId: string) =>
  apiFetch<{ ok: boolean }>('/blocks', { method: 'POST', body: JSON.stringify({ blockedId }) });
export const unblockUser = (userId: string) =>
  apiFetch<{ ok: boolean }>(`/blocks/${userId}`, { method: 'DELETE' });
export interface BlockedUser {
  id: string;
  firstName: string;
  photoUrl: string | null;
  blockedAt: string;
}
export const getBlocked = () => apiFetch<BlockedUser[]>('/blocks');

// ── Akkaunt o'chirish ───────────────────────────────────────
export const deleteAccount = () => apiFetch<{ ok: boolean }>('/users/me', { method: 'DELETE' });

// ── Matches & messages ──────────────────────────────────────
export const getMatches = () => apiFetch<MatchSummary[]>('/matches');
export const getMessages = (matchId: string) =>
  apiFetch<{ user: Profile; online?: boolean; messages: Message[] }>(`/matches/${matchId}/messages`);
export const sendMessage = (matchId: string, content: string) =>
  apiFetch<Message>(`/matches/${matchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
export const sendChatImage = (matchId: string, dataUrl: string) =>
  apiFetch<Message>(`/matches/${matchId}/image`, {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });

// ── Economy (sovg'a / tanga / hamyon) ───────────────────────
export interface GiftItem {
  key: string;
  name: string;
  icon: string;
  emoji: string;
  coinPrice: number;
  premium?: boolean;
}
export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  priceSom: number;
  popular?: boolean;
}
export interface WalletData {
  coinBalance: number;
  walletBalance: number;
  minWithdrawSom?: number;
  gifts: {
    id: string;
    giftKey: string;
    earnedSom: number;
    createdAt: string;
    from: { id: string; firstName: string; photoUrl: string | null };
  }[];
}

export const getGiftCatalog = () => apiFetch<GiftItem[]>('/gifts/catalog');
export const sendGift = (matchId: string, giftKey: string) =>
  apiFetch<{ coinBalance: number; message: Message }>('/gifts/send', {
    method: 'POST',
    body: JSON.stringify({ matchId, giftKey }),
  });
export const getCoinPackages = () => apiFetch<CoinPackage[]>('/coins/packages');

/** Haqiqiy to'lov: Order yaratib, Payme checkout manzilini oladi */
export const createCoinOrder = (packageId: string) =>
  apiFetch<{ orderId: string; amount: number; priceSom: number; coins: number; checkoutUrl: string }>(
    '/coins/order',
    { method: 'POST', body: JSON.stringify({ packageId }) },
  );

/** DEV: to'lovsiz tanga kreditlash (faqat lokal test) */
export const purchaseCoins = (packageId: string) =>
  apiFetch<{ coinBalance: number; added: number }>('/coins/purchase', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  });
export const getWallet = () => apiFetch<WalletData>('/wallet');
export const withdraw = (cardNumber: string, amount: number) =>
  apiFetch<{ walletBalance: number; status: string }>('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ cardNumber, amount }),
  });

// ── Obuna (subscription) ────────────────────────────────────
export type SubTier = 'FREE' | 'PLUS' | 'GOLD' | 'PLATINUM';
export type SubPeriod = 'WEEK' | 'MONTH' | 'YEAR';
export interface PlanPeriod {
  id: string;
  period: SubPeriod;
  priceSom: number;
  discountPercent: number;
}
export interface PlanGroup {
  tier: SubTier;
  label: string;
  periods: PlanPeriod[];
}
export interface MySubscription {
  tier: SubTier;
  until: string | null;
  trialEndsAt: string | null;
  freeForWomen?: boolean;
}

export const getPlans = () => apiFetch<PlanGroup[]>('/subscriptions/plans');
export const getMySubscription = () => apiFetch<MySubscription>('/subscriptions/me');
export const createSubscriptionOrder = (planId: string) =>
  apiFetch<{ orderId: string; amount: number; priceSom: number; tier: SubTier; period: SubPeriod; checkoutUrl: string }>(
    '/subscriptions/order',
    { method: 'POST', body: JSON.stringify({ planId }) },
  );

export const GIFT_EMOJI: Record<string, string> = {
  rose: '🌹',
  heart: '❤️',
  tulip: '🌷',
  chocolate: '🍫',
  teddy: '🧸',
  ring: '💍',
};
