import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

// ── Socket manzili ──────────────────────────────────────────
// Devda localhost:3000, PRODda same-origin (https/wss saqlanadi,
// nginx /socket.io ni :3000 ga proxy qiladi). Mixed Content xatosini oldini oladi.
const _isLocalHostWs =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const BASE =
  import.meta.env.VITE_API_URL ??
  (_isLocalHostWs ? `http://${location.hostname}:3000` : location.origin);

let socket: Socket | null = null;

// ── Offline holatda yuborilmagan xabarlar navbati ──────────
interface PendingMessage {
  matchId: string;
  content: string;
  tempId: string;
  type: 'TEXT' | 'VOICE';
}

/** Offline paytda yuborilishi kerak bo'lgan xabarlar to'plami */
let pendingQueue: PendingMessage[] = [];

/** Navbatga xabar qo'shish */
export function addToPendingQueue(msg: PendingMessage) {
  pendingQueue.push(msg);
}

/** Navbatdagi barcha xabarlarni olish */
export function getPendingQueue(): PendingMessage[] {
  return [...pendingQueue];
}

/** Navbatdan bitta xabarni o'chirish */
export function removeFromPendingQueue(tempId: string) {
  pendingQueue = pendingQueue.filter((m) => m.tempId !== tempId);
}

/** Navbatni tozalash */
export function clearPendingQueue() {
  pendingQueue = [];
}

/**
 * Online bo'lganda navbatdagi barcha xabarlarni serverga yuborish.
 * Har bir xabar uchun callback chaqiriladi (UI yangilash uchun).
 */
function flushPendingQueue(
  onSent?: (tempId: string, serverMsg: any) => void,
  onFailed?: (tempId: string) => void,
) {
  if (!socket?.connected || pendingQueue.length === 0) return;

  const queue = [...pendingQueue];
  pendingQueue = [];

  for (const item of queue) {
    socket.emit(
      'sendMessage',
      { matchId: item.matchId, content: item.content, type: item.type },
      (response: any) => {
        if (response?.error) {
          // Yuborilmadi — qaytadan navbatga qo'shamiz
          pendingQueue.push(item);
          onFailed?.(item.tempId);
        } else {
          onSent?.(item.tempId, response);
        }
      },
    );
  }
}

// ── Asosiy socket funksiyasi ────────────────────────────────
export function getSocket(): Socket | null {
  if (!socket) {
    const token = getToken();
    if (!token) return null;

    // /api qo'shimchasini olib tashlash
    const origin = BASE.replace(/\/api$/, '');

    socket = io(origin, {
      // Callback shakli: HAR qayta ulanishda eng yangi tokenni oladi.
      // (Token yangilansa avtomatik yangi token bilan ulanadi, eski token
      // bilan cheksiz "invalid signature" tsiklini oldini oladi.)
      auth: (cb) => cb({ token: getToken() ?? '' }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Token butunlay yo'q bo'lsa (chiqib ketilgan) — cheksiz urinmaymiz.
    socket.on('connect_error', () => {
      if (!getToken()) disconnectSocket();
    });

    // Qayta ulanganda navbatdagi xabarlarni yuborish
    socket.on('connect', () => {
      flushPendingQueue();
    });
  }
  return socket;
}

// ── Typing statusi yuborish ─────────────────────────────────
/** Server'ga foydalanuvchi yozyotganini yoki to'xtaganini xabar berish */
export function emitTyping(matchId: string, isTyping: boolean) {
  const s = getSocket();
  if (s?.connected) {
    s.emit('typing', { matchId, isTyping });
  }
}

// ── Xabar o'qilganini yuborish ─────────────────────────────
/** Server'ga xabar o'qilganligini xabar berish (read receipt) */
export function emitMessageRead(messageId: string, matchId: string) {
  const s = getSocket();
  if (s?.connected) {
    s.emit('messageRead', { messageId, matchId });
  }
}

// ── Socket'ni uzish ─────────────────────────────────────────
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Birinchi marta ulanmaganda qayta urinish ────────────────
/** 
 * Socket'ni yaratib, agar birinchi ulanish muvaffaqiyatsiz bo'lsa,
 * 5 sekunddan keyin qayta urinib ko'rish.
 * Faqat ilova boshida bir marta chaqiriladi.
 */
export function ensureSocketConnection() {
  const s = getSocket();
  if (!s) return;

  // Agar hali ulanmagan bo'lsa, 5 sekunddan keyin qayta urinish
  if (!s.connected) {
    const retryTimer = setTimeout(() => {
      if (s && !s.connected) {
        s.disconnect();
        s.connect();
      }
    }, 5000);

    // Agar ulansa, taymerni bekor qilish
    s.once('connect', () => {
      clearTimeout(retryTimer);
    });
  }
}
