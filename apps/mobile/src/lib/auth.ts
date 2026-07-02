import { apiFetch, getToken, setToken, clearToken } from './api';

export type Gender = 'MALE' | 'FEMALE';
export type SeekingGender = 'MALE' | 'FEMALE' | 'EVERYONE';
export type Intent = 'SERIOUS' | 'FRIENDSHIP' | 'UNSURE';

export interface Me {
  id: string;
  firstName: string;
  gender: Gender | null;
  seekingGender: SeekingGender | null;
  seekingAgeMin: number | null;
  seekingAgeMax: number | null;
  maxDistance: number | null;
  intent: Intent | null;
  bio: string | null;
  interests: string[];
  birthDate: string | null;
  age: number | null;
  city: string | null;
  onboardingStep: string;
  isVerified: boolean;
  coinBalance: number;
  walletBalance: number;
  notifyShowSender: boolean;
  photos: { id: string; url: string; order: number }[];
}

export interface ProfilePatch {
  firstName?: string;
  gender?: Gender;
  seekingGender?: SeekingGender;
  seekingAgeMin?: number;
  seekingAgeMax?: number;
  maxDistance?: number;
  intent?: Intent;
  bio?: string;
  interests?: string[];
  birthDate?: string;
  city?: string;
  notifyShowSender?: boolean;
}

/**
 * onboardingStep -> ilova marshruti. Ro'yxatdan o'tib bo'lgan foydalanuvchini
 * to'g'ri joyga qaytaradi (qayta ro'yxatdan o'tkazmaslik uchun).
 */
const STEP_ROUTE: Record<string, string> = {
  GENDER_AGE: '/onboarding/gender',
  INTENT: '/onboarding/intent',
  PHOTOS: '/onboarding/photos',
  VERIFY: '/onboarding/verify',
  // PROMPTS/PERMISSIONS ekranlari hozircha yo'q -> tugagan deb hisoblanadi
  PROMPTS: '/discover',
  PERMISSIONS: '/discover',
  DONE: '/discover',
};

/** Foydalanuvchi qaysi bosqichda bo'lsa, o'sha marshrutni beradi. */
export function routeForStep(step: string | undefined | null): string {
  if (!step) return '/onboarding/gender';
  return STEP_ROUTE[step] ?? '/discover';
}

/** Telegram WebApp initData (bot ichida ochilganda) — bo'lmasa undefined. */
function telegramInitData(): string | undefined {
  const tg = (window as any).Telegram?.WebApp;
  const initData: string | undefined = tg?.initData;
  if (tg && initData) {
    tg.ready?.();
    return initData;
  }
  return undefined;
}

/**
 * MAVJUD sessiyani aniqlaydi — YANGI mehmon YARATMAYDI.
 * 1) localStorage'da token bo'lsa — uni saqlaymiz.
 * 2) Telegram ichida bo'lsa — initData bilan kiramiz (mavjud user upsert bo'ladi,
 *    qayta ro'yxatdan o'tmaydi).
 * Sessiya bo'lsa true, aks holda false (Welcome ko'rsatiladi).
 */
export async function resolveExistingSession(): Promise<boolean> {
  if (getToken()) return true;

  const initData = telegramInitData();
  if (initData) {
    try {
      const { token } = await apiFetch<{ token: string }>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      });
      setToken(token);
      return true;
    } catch {
      // Telegram auth ishlamadi — sessiyasiz (Welcome) qolamiz
    }
  }
  return false;
}

/**
 * Ilova ochilishida marshrutni hal qiladi:
 *  - sessiya bor + getMe ishlasa -> onboardingStep bo'yicha marshrut
 *  - token eskirgan/banlangan bo'lsa -> tozalaymiz, Welcome (null)
 *  - sessiya yo'q -> Welcome (null)
 */
export async function resolveBootRoute(): Promise<string | null> {
  const has = await resolveExistingSession();
  if (!has) return null;
  try {
    const me = await getMe();
    return routeForStep(me.onboardingStep);
  } catch {
    // token yaroqsiz (401/403) yoki tarmoq — sessiyani tozalab Welcome'ga
    clearToken();
    return null;
  }
}

/**
 * Sessiyani ochadi: Telegram Mini App ichida bo'lsa initData orqali (haqiqiy Telegram
 * foydalanuvchisi), aks holda mehmon (web/PWA) sifatida. Login ekranisiz.
 * "Boshlash" tugmasi bosilganda chaqiriladi (mehmon YARATISHGA ruxsat).
 */
export async function ensureGuestSession(): Promise<void> {
  if (getToken()) return;

  const initData = telegramInitData();
  if (initData) {
    try {
      const { token } = await apiFetch<{ token: string }>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      });
      setToken(token);
      return;
    } catch {
      // Telegram auth muvaffaqiyatsiz bo'lsa mehmonga tushamiz
    }
  }

  const { token } = await apiFetch<{ token: string }>('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  setToken(token);
}

export function getMe(): Promise<Me> {
  return apiFetch<Me>('/users/me');
}

export function updateProfile(patch: ProfilePatch): Promise<Me> {
  return apiFetch<Me>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
