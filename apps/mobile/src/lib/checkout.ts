/**
 * To'lov (yoki boshqa tashqi) havolani ochish.
 *
 * MUHIM: Telegram Mini App ichida `window.location.href` bilan tashqi domenga
 * (checkout.paycom.uz) o'tib bo'lmaydi — Telegram WebView ilovani o'z domenida
 * ushlab turadi va tashqi to'lov sahifasi ochilmaydi. Shu sabab Telegram ichida
 * `Telegram.WebApp.openLink()` (tashqi brauzerda ochadi) ishlatiladi.
 * Oddiy brauzer/PWA'da esa to'g'ridan-to'g'ri o'sha sahifaga o'tamiz.
 */
export function openCheckout(url: string): void {
  const tg = (window as any).Telegram?.WebApp;
  if (tg && typeof tg.openLink === 'function') {
    tg.openLink(url, { try_instant_view: false });
  } else {
    window.location.href = url;
  }
}
