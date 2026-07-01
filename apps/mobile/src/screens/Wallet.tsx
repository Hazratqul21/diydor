import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate, motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { getWallet, getGiftCatalog, photoUrl, type WalletData, type GiftItem } from '@/lib/data';
import { shortTime } from '@/lib/time';

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

/** Balansni 0 dan haqiqiy qiymatga "sanab" chiqaradi (premium hissi). */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{fmt(display)}</>;
}

export default function Wallet() {
  const nav = useNavigate();
  const [w, setW] = useState<WalletData | null>(null);
  const [catalog, setCatalog] = useState<GiftItem[]>([]);

  useEffect(() => {
    getWallet().then(setW).catch(() => undefined);
    getGiftCatalog().then(setCatalog).catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen pb-stack-lg bg-surface-subtle">
      <header className="sticky top-0 z-50 flex items-center px-margin-main h-14 bg-surface/80 backdrop-blur-xl">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="w-10 h-10 -ml-2 flex items-center text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface">Hamyon</h1>
      </header>

      <main className="px-margin-main pt-stack-md flex flex-col gap-stack-lg">
        {/* Balans kartasi */}
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          className="bg-surface-warm rounded-3xl p-stack-lg shadow-ambient relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed-dim/30 rounded-full blur-2xl" />
          <p className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider mb-stack-sm relative">
            Yig'ilgan mablag'
          </p>
          <h2 className="text-headline-lg font-headline-lg text-on-surface relative mb-1">
            <CountUp value={w?.walletBalance ?? 0} /> so'm
          </h2>
          <div className="flex items-center gap-1 text-secondary mb-stack-lg relative">
            <Icon name="monetization_on" fill className="text-primary text-[18px]" />
            <span className="text-body-md font-body-md">{w?.coinBalance ?? 0} tanga</span>
          </div>
          <motion.button
            onClick={() => nav('/wallet/withdraw')}
            whileTap={{ scale: 0.97 }}
            className="w-full h-[56px] bg-primary text-on-primary rounded-2xl text-body-lg font-body-lg font-semibold flex items-center justify-center gap-2 shadow-md relative"
          >
            <Icon name="payments" /> Pulni yechish
          </motion.button>
        </motion.section>

        {/* Sovg'alar */}
        <section className="flex flex-col gap-stack-sm">
          <h3 className="text-headline-md font-headline-md text-on-surface px-2 mb-stack-sm">Olingan sovg'alar</h3>
          {!w || w.gifts.length === 0 ? (
            <div className="bg-surface-warm rounded-2xl p-6 text-center text-on-surface-variant">
              <Icon name="featured_seasonal_and_gifts" className="text-[36px] text-primary mb-2" />
              <p className="text-body-md font-body-md">Hali sovg'a yo'q</p>
            </div>
          ) : (
            <div className="bg-surface-subtle rounded-3xl p-2 flex flex-col gap-2">
              {w.gifts.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between p-3 bg-surface-warm rounded-2xl shadow-ambient"
                >
                  <div className="flex items-center gap-stack-md">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
                      {g.from.photoUrl ? (
                        <img src={photoUrl(g.from.photoUrl)} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="person" className="text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body-md font-body-md font-semibold text-on-surface">{g.from.firstName}</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">{shortTime(g.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-body-md font-body-md font-bold text-primary">+{fmt(g.earnedSom)} so'm</span>
                    {(() => {
                      const giftInfo = catalog.find((c) => c.key === g.giftKey);
                      return giftInfo ? (
                        <img src={photoUrl(giftInfo.imageUrl)} alt={giftInfo.name} className="w-8 h-8 object-contain mt-1" />
                      ) : (
                        <span className="text-[20px] mt-1">🎁</span>
                      );
                    })()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
