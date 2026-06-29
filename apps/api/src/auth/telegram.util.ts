import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
  queryId?: string;
}

/**
 * Telegram Mini App initData ni tekshiradi (HMAC-SHA256).
 * Hujjat: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Algoritm:
 *   secret_key   = HMAC_SHA256(key="WebAppData", message=bot_token)
 *   check_hash   = HMAC_SHA256(key=secret_key, message=data_check_string)
 *   check_hash === initData.hash  bo'lsa ma'lumot haqiqiy.
 *
 * @throws Error agar imzo noto'g'ri yoki ma'lumot buzilgan bo'lsa.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400,
): VerifiedInitData {
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN sozlanmagan');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('initData ichida hash yo\'q');
  }

  // hash dan tashqari barcha maydonlarni alifbo tartibida yig'amiz
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const checkHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Doimiy vaqtli solishtirish (timing attack'dan himoya)
  const valid =
    checkHash.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(checkHash), Buffer.from(hash));

  if (!valid) {
    throw new Error('initData imzosi noto\'g\'ri (spoofing urinishi?)');
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate) {
    throw new Error('auth_date yo\'q');
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) {
    throw new Error('initData muddati o\'tgan');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('initData ichida user yo\'q');
  }

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new Error('user JSON buzilgan');
  }

  return {
    user,
    authDate,
    queryId: params.get('query_id') ?? undefined,
  };
}
