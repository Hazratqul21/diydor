// API manzili: VITE_API_URL bo'lsa o'sha; aks holda devda localhost:3000,
// PRODDA same-origin (location.origin/api) — https saqlanadi, nginx /api ni
// :3000 ga proxy qiladi. (Avval http://host:3000 edi -> HTTPS'da Mixed Content
// bloklanardi va ilova ishlamasdi.)
const _isLocalHost =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const BASE =
  import.meta.env.VITE_API_URL ??
  (_isLocalHost ? `http://${location.hostname}:3000/api` : `${location.origin}/api`);
const TOKEN_KEY = 'diydor_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** base64url -> matn (JWT payload'i base64url'da: -/_ va padding'siz).
 *  atob to'g'ridan-to'g'ri base64url'ni o'qiy olmaydi (- va _ da xato beradi). */
function decodeBase64Url(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return atob(s);
}

/** JWT'dan joriy user id (sub) ni oladi — qo'shimcha so'rovsiz. */
export function getUserId(): string | null {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(t.split('.')[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Server xatosi — paywall kabi maxsus kodlarni tashiydi. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = opts.body instanceof FormData;
  const headers: any = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...opts, headers });
  } catch {
    // Tarmoq uzilgan / serverga ulanib bo'lmadi
    throw new ApiError('Internet aloqasi yo‘q. Qaytadan urinib ko‘ring.', 0, 'NETWORK');
  }

  // Token yaroqsiz/eskirgan (auth bo'lmagan so'rovlardan tashqari) -> sessiyani tozalab Welcome'ga
  if (res.status === 401 && token && !path.startsWith('/auth/')) {
    clearToken();
    if (location.pathname !== '/') location.assign('/');
    throw new ApiError('Sessiya tugadi. Qaytadan kiring.', 401, 'UNAUTHORIZED');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as any);
    // NestJS ForbiddenException({code,message}) -> body.message obyekt yoki matn bo'lishi mumkin
    const payload = typeof body.message === 'object' && body.message ? body.message : body;
    const msg = payload.message || body.message || `Server xatosi (${res.status})`;
    throw new ApiError(typeof msg === 'string' ? msg : 'Xatolik', res.status, payload.code || body.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
