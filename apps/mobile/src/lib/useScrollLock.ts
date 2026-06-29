import { useEffect } from 'react';

/**
 * Modal/overlay ochilganda fon (body) scroll'ini bloklaydi.
 * iOS Safari'da overlay orqasidagi sahifa siljishi (scroll bleed) oldini oladi.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
