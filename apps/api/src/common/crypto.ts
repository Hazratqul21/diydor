import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Maxfiy qiymatlarni (Payme kaliti) bazada shifrlangan saqlash uchun AES-256-GCM.
 * Master kalit: APP_ENCRYPTION_KEY env (yo'q bo'lsa JWT_SECRET'dan hosil qilinadi — dev fallback).
 * Format: iv(hex):authTag(hex):ciphertext(hex)
 */
function masterKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.JWT_SECRET || 'diydor-dev-fallback-key';
  // 32 baytli kalit hosil qilamiz (scrypt)
  return scryptSync(secret, 'diydor-payment-salt', 32);
}

export function encryptSecret(plain: string): string {
  if (!plain) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return '';
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    if (!ivHex || !tagHex || !dataHex) return '';
    const decipher = createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

/** Kalitning oxirgi 4 belgisini ko'rsatish uchun (admin UI'da maskalangan holat). */
export function maskTail(payload: string | null | undefined): string | null {
  const val = decryptSecret(payload);
  if (!val) return null;
  return val.length <= 4 ? '••••' : `••••${val.slice(-4)}`;
}
