import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureGuestSession, resolveBootRoute, routeForStep, getMe } from '@/lib/auth';
import { getPublicConfig, photoUrl } from '@/lib/data';
import { Icon } from '@/components/Icon';

// Ilovadagi standart hero (admin rasm qo'ymagan bo'lsa)
const DEFAULT_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-H_P26uJDFgYfG9CEFIdb4ka7MfWMB2tknags9uPNVvrE07-LlEphJXj9z5Oe4m9XCviq7-mePk2rOkyBgfhKne12UbGCOlGMDBwChgKJ8ajZVN44CCYJ-9Rg5XogzC0bLG30-xd-UTCV3_jvD9rdiVJiSiseDm3KPU4mYBPncuMiRPvO5pFSc40blDSS1yS-9AC4b_ludbyTn7V_Bga40vN4jdsaKIs81Ij44KFzC5kF7WqAQhwnu4__aoaelhPQNx6pAMQy-Wc';
const DEFAULT_TITLE = 'Diydor';
const DEFAULT_SUBTITLE = 'Qalblar uchrashadigan joy';

export default function Welcome() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<'booting' | 'welcome'>('booting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hero, setHero] = useState(DEFAULT_HERO);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Ilova ochilishi: mavjud sessiya bo'lsa to'g'ri joyga yuboramiz
  // (ro'yxatdan o'tgan foydalanuvchi qayta ro'yxatdan o'tmaydi).
  useEffect(() => {
    let alive = true;
    (async () => {
      // Brendingni parallel yuklaymiz (Welcome ko'rsatilsa kerak bo'ladi)
      const brandingP = getPublicConfig().catch(() => null);

      const route = await resolveBootRoute();
      if (!alive) return;
      if (route) {
        nav(route, { replace: true });
        return;
      }

      const b = await brandingP;
      if (!alive) return;
      if (b?.welcomeImageUrl) setHero(photoUrl(b.welcomeImageUrl));
      if (b?.welcomeTitle) setTitle(b.welcomeTitle);
      if (b?.welcomeSubtitle) setSubtitle(b.welcomeSubtitle);
      setPhase('welcome');
    })();
    return () => {
      alive = false;
    };
  }, [nav]);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      await ensureGuestSession();
      // Sessiya ochildi — bosqichga qarab yo'naltiramiz (mavjud user resume bo'ladi)
      let target = '/onboarding/gender';
      try {
        const me = await getMe();
        target = routeForStep(me.onboardingStep);
      } catch {
        /* yangi mehmon — standart onboarding boshidan */
      }
      nav(target, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  // ── Splash (sessiya tekshirilayotganda) ──
  if (phase === 'booting') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-16 h-16 rounded-3xl bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_rgba(167,56,51,0.3)] heartbeat">
          <Icon name="favorite" fill className="text-[32px]" />
        </div>
        <div className="w-6 h-6">
          <Icon name="progress_activity" className="animate-spin text-primary/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Hero */}
      <div
        className="relative w-full h-[55vh] flex-shrink-0 fade-in bg-primary-container"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
        }}
      >
        {/* Yuklanmaguncha shimmer */}
        {!heroLoaded && <div className="absolute inset-0 shimmer" />}
        <img
          src={hero}
          alt={title}
          onLoad={() => setHeroLoaded(true)}
          onError={() => {
            if (hero !== DEFAULT_HERO) setHero(DEFAULT_HERO);
            else setHeroLoaded(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            heroLoaded ? 'opacity-100 ken-burns' : 'opacity-0'
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-margin-main pb-stack-lg z-20 -mt-10">
        <div className="flex flex-col items-center text-center gap-stack-sm mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary fade-in-up-d1 tracking-tight">
            {title}
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant fade-in-up-d2 max-w-[280px]">
            {subtitle}
          </p>
        </div>

        <div className="w-full fade-in-up-d2 pb-8">
          <button
            onClick={start}
            disabled={loading}
            className="w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg press flex items-center justify-center shadow-[0_8px_16px_rgba(167,56,51,0.2)] disabled:opacity-60 active:shadow-[0_4px_8px_rgba(167,56,51,0.2)]"
          >
            {loading ? <Icon name="progress_activity" className="animate-spin" /> : 'Boshlash'}
          </button>

          {error && <p className="text-center text-label-sm text-error mt-stack-sm">{error}</p>}

          <p className="text-center text-label-sm font-label-sm text-on-surface-variant mt-stack-md opacity-70 px-4">
            Boshlash tugmasini bosish orqali siz bizning{' '}
            <button type="button" onClick={() => nav('/legal/terms')} className="underline text-primary">
              Foydalanish shartlari
            </button>{' '}
            va{' '}
            <button type="button" onClick={() => nav('/legal/privacy')} className="underline text-primary">
              Maxfiylik siyosatimizga
            </button>{' '}
            rozilik bildirasiz.
          </p>
        </div>
      </div>
    </div>
  );
}
