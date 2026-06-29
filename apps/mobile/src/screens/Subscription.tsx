import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import {
  getPlans,
  getMySubscription,
  createSubscriptionOrder,
  type PlanGroup,
  type SubPeriod,
  type SubTier,
  type MySubscription,
} from '@/lib/data';

const PERIOD_LABEL: Record<SubPeriod, string> = { WEEK: 'Hafta', MONTH: 'Oy', YEAR: 'Yil' };
const PERIOD_ORDER: SubPeriod[] = ['WEEK', 'MONTH', 'YEAR'];

const TIER_META: Record<Exclude<SubTier, 'FREE'>, { color: string; icon: string; perks: string[] }> = {
  PLUS: {
    color: 'text-sky-500',
    icon: 'add_circle',
    perks: ['Cheksiz yoqtirish', "Ko'proq SuperLike", 'Reklama yo\'q'],
  },
  GOLD: {
    color: 'text-amber-500',
    icon: 'workspace_premium',
    perks: ['Plus imkoniyatlari', 'Sizni kim yoqtirganini ko\'rish', 'Haftalik bepul Boost'],
  },
  PLATINUM: {
    color: 'text-violet-500',
    icon: 'diamond',
    perks: ['Gold imkoniyatlari', 'Profilingiz yuqorida', 'Xabar yuborib tanishish'],
  },
};

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

export default function Subscription() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [groups, setGroups] = useState<PlanGroup[]>([]);
  const [mine, setMine] = useState<MySubscription | null>(null);
  const [period, setPeriod] = useState<SubPeriod>('MONTH');
  const [tier, setTier] = useState<SubTier>('GOLD');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlans(), getMySubscription()])
      .then(([g, m]) => {
        setGroups(g);
        setMine(m);
        // Likes'dan kelgan bo'lsa Gold'ni oldindan tanlaymiz
        if (params.get('from') === 'likes') setTier('GOLD');
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [params]);

  const selectedPlan = useMemo(() => {
    const g = groups.find((x) => x.tier === tier);
    return g?.periods.find((p) => p.period === period);
  }, [groups, tier, period]);

  async function buy() {
    if (!selectedPlan || busy) return;
    setBusy(true);
    try {
      const order = await createSubscriptionOrder(selectedPlan.id);
      window.location.href = order.checkoutUrl;
    } catch {
      setBusy(false);
    }
  }

  const womenFree = mine?.freeForWomen === true;
  const activeTier = mine && mine.tier !== 'FREE' ? mine.tier : null;

  // Ayollar uchun barcha imkoniyatlar bepul — to'lov ekrani ko'rsatilmaydi
  if (womenFree) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <header className="sticky top-0 z-50 flex items-center px-margin-main h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/50">
          <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
            <Icon name="arrow_back_ios" />
          </button>
          <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">Premium</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-stack-md">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-black shadow-[0_8px_30px_rgba(245,180,50,0.4)]"
          >
            <Icon name="workspace_premium" fill className="text-[40px]" />
          </motion.div>
          <h2 className="text-headline-md font-headline-md text-on-surface">Siz uchun barchasi bepul ✨</h2>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-[300px]">
            Cheksiz yoqtirish, sizni kim yoqtirganini ko'rish va barcha premium imkoniyatlar siz uchun mutlaqo bepul.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface pb-[120px]">
      <header className="sticky top-0 z-50 flex items-center px-margin-main h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/50">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">
          Obuna
        </h1>
      </header>

      <main className="flex-1 px-margin-main pt-stack-lg">
        {activeTier && (
          <div className="bg-primary-container/25 rounded-2xl p-4 mb-stack-lg flex items-center gap-3">
            <Icon name="verified" fill className="text-primary text-[24px]" />
            <p className="text-label-md font-label-md text-on-surface flex-1">
              Sizda <b>{activeTier}</b> obunasi faol
              {mine?.until ? ` — ${new Date(mine.until).toLocaleDateString('ru-RU')} gacha` : ''}.
            </p>
          </div>
        )}

        {/* Davr tanlovi */}
        <div className="flex bg-surface-container rounded-full p-1 mb-stack-lg">
          {PERIOD_ORDER.map((p) => {
            const on = period === p;
            const grp = groups.find((g) => g.tier === tier);
            const disc = grp?.periods.find((x) => x.period === p)?.discountPercent ?? 0;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 h-10 rounded-full text-label-md font-label-md press transition-colors relative ${
                  on ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                {PERIOD_LABEL[p]}
                {disc > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full px-1.5 py-0.5 ${on ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary'}`}>
                    -{disc}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tier kartalari */}
        {loading ? (
          <div className="space-y-stack-sm">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-stack-sm">
            {groups.map((g, gi) => {
              if (g.tier === 'FREE') return null;
              const meta = TIER_META[g.tier as Exclude<SubTier, 'FREE'>];
              const pp = g.periods.find((p) => p.period === period);
              const on = tier === g.tier;
              return (
                <motion.button
                  key={g.tier}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, scale: on ? 1 : 0.99 }}
                  transition={{ delay: gi * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTier(g.tier)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
                    on
                      ? 'border-primary bg-primary-fixed/20 shadow-[0_8px_24px_rgba(167,56,51,0.15)]'
                      : 'border-transparent bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon name={meta.icon} fill className={`text-[24px] ${meta.color}`} />
                      <span className="text-title-lg font-headline-md text-on-surface">{g.label}</span>
                    </div>
                    {pp && (
                      <div className="text-right">
                        <div className="text-body-lg font-headline-md text-on-surface">{fmt(pp.priceSom)} so'm</div>
                        <div className="text-[11px] text-on-surface-variant">/ {PERIOD_LABEL[pp.period].toLowerCase()}</div>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {meta.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                        <Icon name="check" className="text-primary text-[16px]" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-on-surface-variant text-center mt-stack-md">
          To'lov Payme orqali xavfsiz amalga oshiriladi. Istalgan vaqtda bekor qilishingiz mumkin.
        </p>
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pb-safe-bottom pt-4 bg-surface/85 backdrop-blur-md border-t border-surface-variant/20">
        <motion.button
          onClick={buy}
          disabled={busy || !selectedPlan}
          whileTap={{ scale: 0.97 }}
          className="w-full h-[56px] bg-primary text-on-primary rounded-2xl flex items-center justify-center gap-2 font-headline-md text-body-lg shadow-md disabled:opacity-60"
        >
          {busy ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <>
              <Icon name="lock_open" />
              {selectedPlan ? `${fmt(selectedPlan.priceSom)} so'm — obuna bo'lish` : 'Obuna bo\'lish'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
