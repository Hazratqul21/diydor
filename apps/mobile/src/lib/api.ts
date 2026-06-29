const BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000/api`;
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

/** JWT'dan joriy user id (sub) ni oladi — qo'shimcha so'rovsiz. */
export function getUserId(): string | null {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
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
