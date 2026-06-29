import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';

/** Internet uzilganda yuqorida ogohlantirish ko'rsatadi. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[480px] bg-error text-on-error text-label-sm font-label-sm py-2 px-4 flex items-center justify-center gap-2"
        >
          <Icon name="wifi_off" className="text-[16px]" />
          Internet aloqasi yo'q
        </motion.div>
      )}
    </AnimatePresence>
  );
}
