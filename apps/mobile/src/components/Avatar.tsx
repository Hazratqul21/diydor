import { useState } from 'react';
import { photoUrl } from '@/lib/data';

/**
 * Foydalanuvchi avatari. Rasm bo'lmasa yoki yuklanmasa (404 — masalan fayl
 * o'chgan bo'lsa) buzuq "?" o'rniga ism bosh harfini rangli fonda ko'rsatadi.
 */
export function Avatar({
  url,
  name,
  className = 'w-9 h-9',
}: {
  url?: string | null;
  name?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const showImg = url && !failed;

  return (
    <div className={`${className} rounded-full overflow-hidden bg-primary/15 flex items-center justify-center shrink-0`}>
      {showImg ? (
        <img
          src={photoUrl(url)}
          alt={name ?? ''}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-title-md text-primary select-none">{initial}</span>
      )}
    </div>
  );
}
