const BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000/api`;
const TOKEN_KEY = 'diydor_admin_token';

// Rasm/asset origin: API origin (diydorapp.uz), admin domeni emas.
// `/uploads/...` admin.diydorapp.uz da xizmat qilinmaydi — API domeniga yo'naltiramiz.
const ASSET_ORIGIN = BASE.replace(/\/api$/, '');
export function assetUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : ASSET_ORIGIN + url;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    if (!location.pathname.startsWith('/login')) location.assign('/login');
    throw new ApiError('Sessiya tugadi', 401);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as any);
    throw new ApiError(body.message || `Server xatosi (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
