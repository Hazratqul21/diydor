/**
 * Telegram Mini App (TMA) native integratsiya moduli.
 * Haptic feedback, BackButton, va platformaga xos sozlamalar.
 *
 * Agar ilova Telegram ichida OCHILMAGAN bo'lsa (oddiy brauzer),
 * barcha funksiyalar xavfsiz tarzda NO-OP (hech narsa qilmaydi).
 */

// ── Telegram WebApp ob'ektini olish ─────────────────────────
function getTg(): any {
  return (window as any).Telegram?.WebApp;
}

// ── Ilova tayyor ekanligini e'lon qilish ────────────────────
/**
 * Telegram Mini App ochilganda chaqirilishi kerak.
 * Bu Telegram'ga ilovaning to'liq yuklanganini bildiradi
 * va loading spinner'ni yashiradi.
 */
export function tmaReady() {
  const tg = getTg();
  if (!tg) return;

  tg.ready?.();

  // Ilovani to'liq ekranga ochish (headerbar'siz)
  tg.expand?.();

  // Yopish tasdiqlash dialogini yoqish (foydalanuvchi tasodifan chiqmasligi uchun)
  tg.enableClosingConfirmation?.();

  // Viewport'ni kengaytirish
  if (tg.isVersionAtLeast?.('6.1')) {
    tg.setHeaderColor?.('#1c1917'); // platinum-dark rangi
    tg.setBackgroundColor?.('#1c1917');
  }
}

// ── Haptic Feedback (Titrash) ────────────────────────────────
/**
 * Yengil titrash — tugma bosishda, svayp boshida.
 * Juda yoqimli va yengil hissiyot beradi.
 */
export function hapticLight() {
  getTg()?.HapticFeedback?.impactOccurred?.('light');
}

/**
 * O'rtacha titrash — LIKE bosishda, match yuzaga kelganda.
 */
export function hapticMedium() {
  getTg()?.HapticFeedback?.impactOccurred?.('medium');
}

/**
 * Kuchli titrash — SUPERLIKE, xatolik yuz berganda.
 */
export function hapticHeavy() {
  getTg()?.HapticFeedback?.impactOccurred?.('heavy');
}

/**
 * Muvaffaqiyat bildirishmasi — to'lov amalga oshdi, verifikatsiya o'tdi.
 */
export function hapticSuccess() {
  getTg()?.HapticFeedback?.notificationOccurred?.('success');
}

/**
 * Xato bildirishmasi — xato yuz berdi, ruxsat berilmadi.
 */
export function hapticError() {
  getTg()?.HapticFeedback?.notificationOccurred?.('error');
}

/**
 * Ogohlantirish titrashi — limit tugadi, tanlov o'chdi.
 */
export function hapticWarning() {
  getTg()?.HapticFeedback?.notificationOccurred?.('warning');
}

/**
 * Tanlash o'zgarishi — pill switch, checkbox, tab o'zgarishida.
 */
export function hapticSelectionChanged() {
  getTg()?.HapticFeedback?.selectionChanged?.();
}

// ── BackButton (Orqaga tugmasi) ──────────────────────────────
/**
 * Telegram'dagi nativ "Orqaga" tugmasini ko'rsatish.
 * @param onClick — tugma bosilganda chaqiriladigan funksiya
 */
export function showBackButton(onClick: () => void) {
  const tg = getTg();
  if (!tg?.BackButton) return;

  tg.BackButton.show();
  // Avvalgi handler'ni tozalab, yangisini o'rnatish
  tg.BackButton.offClick?.();
  tg.BackButton.onClick(onClick);
}

/**
 * Telegram'dagi nativ "Orqaga" tugmasini yashirish.
 */
export function hideBackButton() {
  const tg = getTg();
  if (!tg?.BackButton) return;

  tg.BackButton.hide();
  tg.BackButton.offClick?.();
}

// ── Scroll Lock (Ekran sakrashini oldini olish) ──────────────
/**
 * Telegram Mini App'da body scroll'ni to'xtatish.
 * Ilovani brauzer emas, native app sezgisini beradi.
 * Bu overscroll-behavior va touch-action orqali amalga oshiriladi.
 * App boshlanishida bir marta chaqiriladi.
 */
export function lockTmaScroll() {
  const tg = getTg();
  if (!tg) return;

  // Body scroll'ni bloklash
  document.body.style.overscrollBehavior = 'none';
  document.body.style.touchAction = 'pan-x pan-y';
  document.documentElement.style.overscrollBehavior = 'none';

  // iOS rubber-band scroll'ni oldini olish
  document.addEventListener(
    'touchmove',
    (e) => {
      // Faqat scroll bo'lmaydigan elementlarda bloklash
      const target = e.target as HTMLElement;
      const scrollable = target.closest('[data-scrollable]') || target.closest('.overflow-y-auto') || target.closest('.overflow-auto');
      if (!scrollable) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

// ── Platformani aniqlash ─────────────────────────────────────
/** Telegram ichida ochilganmi? */
export function isTMA(): boolean {
  return !!getTg();
}

/** Qaysi platformada (ios/android/web)? */
export function tmaPlatform(): 'ios' | 'android' | 'web' | 'unknown' {
  const tg = getTg();
  if (!tg) return 'web';
  const p = tg.platform?.toLowerCase() ?? '';
  if (p.includes('ios')) return 'ios';
  if (p.includes('android')) return 'android';
  return 'unknown';
}
