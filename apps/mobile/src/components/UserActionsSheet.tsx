import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';
import { reportUser, blockUser } from '@/lib/data';
import { useScrollLock } from '@/lib/useScrollLock';

const REASONS: { key: string; label: string }[] = [
  { key: 'FAKE', label: 'Soxta profil' },
  { key: 'INAPPROPRIATE', label: 'Nomaqbul kontent' },
  { key: 'HARASSMENT', label: 'Tahqir / bezovta qilish' },
  { key: 'SPAM', label: 'Spam / reklama' },
  { key: 'UNDERAGE', label: 'Voyaga yetmagan' },
  { key: 'OTHER', label: 'Boshqa sabab' },
];

/**
 * Foydalanuvchi ustidan shikoyat / bloklash oynasi (bottom sheet).
 * ProfileDetail va Chat'da "more" tugmasi ochadi.
 */
export function UserActionsSheet({
  userId,
  userName,
  open,
  onClose,
  onBlocked,
}: {
  userId: string;
  userName: string;
  open: boolean;
  onClose: () => void;
  onBlocked?: () => void;
}) {
  const [view, setView] = useState<'menu' | 'reasons'>('menu');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  useScrollLock(open);

  async function doBlock() {
    if (busy) return;
    setBusy(true);
    try {
      await blockUser(userId);
      setDone('Foydalanuvchi bloklandi');
      setTimeout(() => {
        onBlocked?.();
        onClose();
      }, 900);
    } catch {
      setBusy(false);
    }
  }

  async function doReport(reason: string) {
    if (busy) return;
    setBusy(true);
    try {
      await reportUser(userId, reason);
      setDone('Shikoyatingiz qabul qilindi');
      setTimeout(onClose, 1100);
    } catch {
      setBusy(false);
    }
  }

  function reset() {
    setView('menu');
    setBusy(false);
    setDone(null);
  }

  return (
    <AnimatePresence onExitComplete={reset}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end max-w-[480px] mx-auto"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface rounded-t-[28px] p-4 pb-safe-bottom"
          >
            <div className="w-12 h-1.5 bg-on-surface-variant/30 rounded-full mx-auto mb-4" />

            {done ? (
              <div className="flex flex-col items-center text-center py-6 gap-2">
                <Icon name="check_circle" fill className="text-success text-[48px]" />
                <p className="text-body-lg font-body-lg text-on-surface">{done}</p>
              </div>
            ) : view === 'menu' ? (
              <div className="flex flex-col">
                <p className="text-center text-label-sm text-on-surface-variant mb-2">{userName}</p>
                <button
                  onClick={() => setView('reasons')}
                  className="w-full h-[52px] flex items-center gap-3 px-2 text-left text-body-md text-on-surface press"
                >
                  <Icon name="flag" className="text-[22px] text-on-surface-variant" /> Shikoyat qilish
                </button>
                <button
                  onClick={doBlock}
                  disabled={busy}
                  className="w-full h-[52px] flex items-center gap-3 px-2 text-left text-body-md text-error press"
                >
                  <Icon name="block" className="text-[22px]" /> Bloklash
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-[52px] mt-1 rounded-xl bg-surface-container text-body-md font-medium text-on-surface press"
                >
                  Bekor qilish
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <button onClick={() => setView('menu')} className="flex items-center gap-1 text-label-sm text-primary mb-2 press">
                  <Icon name="arrow_back_ios" className="text-[14px]" /> Orqaga
                </button>
                <p className="text-center text-label-sm text-on-surface-variant mb-2">Shikoyat sababi</p>
                {REASONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => doReport(r.key)}
                    disabled={busy}
                    className="w-full h-[50px] flex items-center justify-between px-2 text-left text-body-md text-on-surface border-b border-surface-variant/30 press disabled:opacity-50"
                  >
                    {r.label}
                    <Icon name="chevron_right" className="text-on-surface-variant" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
