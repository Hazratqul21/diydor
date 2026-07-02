import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  PanInfo,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import {
  getDiscovery,
  swipe,
  rewindSwipe,
  photoUrl,
  type Profile,
  type SwipeAction,
  type SwipeResult,
} from '@/lib/data';
import { ApiError } from '@/lib/api';
import { useScrollLock } from '@/lib/useScrollLock';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticWarning } from '@/lib/tma';

const INTEREST_ICON: Record<string, string> = {
  Qahva: 'coffee',
  Kofe: 'local_cafe',
  "San'at": 'palette',
  Sayohat: 'flight',
  Kitoblar: 'menu_book',
  Musiqa: 'music_note',
  Sport: 'fitness_center',
  Kino: 'movie',
  Tabiat: 'park',
};

type SwipeDir = 'left' | 'right' | 'up';
type CardHandle = { swipe: (dir: SwipeDir) => void };

function dirToAction(dir: SwipeDir): SwipeAction {
  return dir === 'right' ? 'LIKE' : dir === 'left' ? 'PASS' : 'SUPERLIKE';
}

export default function Discover() {
  const nav = useNavigate();
  const [tab, setTab] = useState<'for-you' | 'nearby'>('for-you');
  const [cards, setCards] = useState<Profile[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<SwipeResult | null>(null);
  const [paywall, setPaywall] = useState<{ title: string; message: string } | null>(null);
  const cardRef = useRef<CardHandle>(null);
  const busy = useRef(false);
  useScrollLock(!!match || !!paywall);

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    getDiscovery(20, tab === 'nearby')
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const current = cards[idx];
  const next = cards[idx + 1];

  // Karta ekrandan chiqib bo'lgach (drag yoki tugma) chaqiriladi
  async function onExited(action: SwipeAction) {
    if (!current) return;
    const target = current.id;
    setIdx((i) => i + 1); // optimistik: keyingi kartaga

    // Haptic feedback — svayp turiga qarab titrash
    if (action === 'LIKE') hapticMedium();
    else if (action === 'SUPERLIKE') hapticHeavy();
    else hapticLight();

    try {
      const res = await swipe(target, action);
      if (res.match) {
        hapticSuccess(); // Match bo'lsa kuchli muvaffaqiyat titrashi
        setMatch(res);
      }
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'SWIPE_LIMIT' || e.code === 'SUPERLIKE_LIMIT')) {
        hapticWarning(); // Limit tugaganda ogohlantirish titrashi
        setIdx((i) => i - 1); // kartani qaytaramiz
        setPaywall({
          title: e.code === 'SUPERLIKE_LIMIT' ? 'SuperLike tugadi' : 'Kunlik limit tugadi',
          message: e.message,
        });
      }
      // boshqa xato: karta o'tib ketgan holicha qoladi
    } finally {
      busy.current = false;
    }
  }

  function triggerSwipe(dir: SwipeDir) {
    if (!current || busy.current || paywall) return;
    busy.current = true;
    cardRef.current?.swipe(dir);
  }

  async function handleRewind() {
    if (busy.current || paywall) return;
    busy.current = true;
    try {
      await rewindSwipe();
      // Muvaffaqiyatli bo'lsa, qidiruvni yangilash yoki shunchaki xabar chiqarish
      setTab(tab === 'for-you' ? 'nearby' : 'for-you');
      setTimeout(() => setTab(tab), 10); // kichik hack: tab'ni yangilab discovery ni qayta yuklash
    } catch (e) {
      if (e instanceof ApiError && e.code === 'REWIND_LOCKED') {
        setPaywall({
          title: 'Premium funksiya',
          message: e.message,
        });
      }
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Header: segmented */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-40 flex justify-center items-center h-14 bg-surface/70 backdrop-blur-xl">
        <div className="flex items-center bg-surface-subtle p-1 rounded-full w-64">
          <button
            onClick={() => setTab('for-you')}
            className={`flex-1 py-1.5 rounded-full text-label-sm font-label-sm transition-colors ${
              tab === 'for-you' ? 'bg-surface-warm clay-sm text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            Siz uchun
          </button>
          <button
            onClick={() => setTab('nearby')}
            className={`flex-1 py-1.5 rounded-full text-label-sm font-label-sm transition-colors ${
              tab === 'nearby' ? 'bg-surface-warm clay-sm text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            Yaqin atrofda
          </button>
        </div>
      </header>

      {/* Card area */}
      <main className="flex-1 flex items-center justify-center pt-16 pb-[150px] px-margin-main relative">
        {loading ? (
          <div className="w-full max-w-[380px] aspect-[3/4] rounded-[24px] shimmer" />
        ) : !current ? (
          <EmptyState nearby={tab === 'nearby'} />
        ) : (
          <>
            {next && <CardStatic key={next.id} profile={next} />}
            <SwipeCard
              key={current.id}
              ref={cardRef}
              profile={current}
              onExited={onExited}
              onOpen={() => nav(`/u/${current.id}`)}
            />
            <ActionButtons onAct={triggerSwipe} onRewind={handleRewind} />
          </>
        )}
      </main>

      <BottomNav />

      <AnimatePresence>
        {match?.user && (
          <MatchOverlay
            profile={match.user}
            matchId={match.matchId!}
            onChat={() => nav(`/chat/${match.matchId}`)}
            onContinue={() => setMatch(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paywall && (
          <Paywall
            title={paywall.title}
            message={paywall.message}
            onSubscribe={() => nav('/subscription?from=swipe')}
            onClose={() => setPaywall(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────── Draggable (asosiy) karta ───────────────

const SwipeCard = forwardRef<CardHandle, { profile: Profile; onExited: (a: SwipeAction) => void; onOpen: () => void }>(
  function SwipeCard({ profile, onExited, onOpen }, ref) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-16, 16]);
    const likeOp = useTransform(x, [30, 140], [0, 1]);
    const nopeOp = useTransform(x, [-30, -140], [0, 1]);
    const superOp = useTransform(y, [-30, -140], [0, 1]);
    const dragging = useRef(false);

    async function doSwipe(dir: SwipeDir) {
      const toX = dir === 'right' ? 700 : dir === 'left' ? -700 : 0;
      const toY = dir === 'up' ? -900 : 0;
      const opts = { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const };
      if (toX) animate(x, toX, opts);
      if (toY) animate(y, toY, opts);
      await new Promise((r) => setTimeout(r, 300));
      onExited(dirToAction(dir));
    }
    useImperativeHandle(ref, () => ({ swipe: doSwipe }));

    function onDragEnd(_: unknown, info: PanInfo) {
      dragging.current = false;
      const { offset, velocity } = info;
      if (offset.y < -130 && Math.abs(offset.x) < 110) return void doSwipe('up');
      if (offset.x > 120 || velocity.x > 650) return void doSwipe('right');
      if (offset.x < -120 || velocity.x < -650) return void doSwipe('left');
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 22 });
      animate(y, 0, { type: 'spring', stiffness: 320, damping: 22 });
    }

    const photo = profile.photos[0];

    return (
      <motion.div
        drag
        dragElastic={0.65}
        dragMomentum={false}
        onDragStart={() => (dragging.current = true)}
        onDragEnd={onDragEnd}
        onTap={() => {
          if (!dragging.current) onOpen();
        }}
        style={{ x, y, rotate, zIndex: 2 }}
        initial={{ scale: 0.94, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute w-full max-w-[380px] aspect-[3/4] max-h-[68vh] rounded-[24px] overflow-hidden shadow-[0px_10px_30px_rgba(0,0,0,0.14)] bg-surface-container-lowest cursor-grab active:cursor-grabbing touch-none"
      >
        {photo ? (
          <img
            src={photoUrl(photo.url)}
            alt={profile.firstName}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
            <Icon name="person" className="text-[80px] text-on-surface-variant" />
          </div>
        )}
        <div className="absolute bottom-0 w-full h-3/5 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Drag overlay badge'lari */}
        <motion.div
          style={{ opacity: likeOp }}
          className="absolute top-8 left-6 rotate-[-16deg] border-4 border-success text-success rounded-xl px-3 py-1 text-2xl font-extrabold tracking-wider"
        >
          YOQDI
        </motion.div>
        <motion.div
          style={{ opacity: nopeOp }}
          className="absolute top-8 right-6 rotate-[16deg] border-4 border-error text-error rounded-xl px-3 py-1 text-2xl font-extrabold tracking-wider"
        >
          KEYINGI
        </motion.div>
        <motion.div
          style={{ opacity: superOp }}
          className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-tertiary text-tertiary rounded-xl px-3 py-1 text-2xl font-extrabold tracking-wider"
        >
          SUPER
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full p-6 text-white pointer-events-none">
          <div className="flex items-end gap-2">
            <h2 className="text-headline-lg font-headline-lg leading-none">{profile.firstName},</h2>
            {profile.age && (
              <span className="text-headline-md font-headline-md font-normal opacity-90 leading-none pb-0.5">
                {profile.age}
              </span>
            )}
            {profile.isVerified && <Icon name="verified" fill className="text-[20px] text-white pb-0.5" />}
          </div>
          {profile.city && (
            <div className="flex items-center gap-1.5 opacity-80 mt-2">
              <Icon name="location_on" className="text-[16px]" />
              <span className="text-body-md font-body-md">{profile.city}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.interests.slice(0, 3).map((it) => (
              <div
                key={it}
                className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-label-sm font-label-sm flex items-center gap-1"
              >
                <Icon name={INTEREST_ICON[it] ?? 'tag'} className="text-[14px]" />
                {it}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  },
);

// Orqadagi (keyingi) karta — statik, kichikroq
function CardStatic({ profile }: { profile: Profile }) {
  const photo = profile.photos[0];
  return (
    <motion.div
      initial={{ scale: 0.9, y: 16 }}
      animate={{ scale: 0.94, y: 12 }}
      transition={{ duration: 0.3 }}
      style={{ zIndex: 1 }}
      className="absolute w-full max-w-[380px] aspect-[3/4] max-h-[68vh] rounded-[24px] overflow-hidden shadow-[0px_10px_30px_rgba(0,0,0,0.08)] bg-surface-container-lowest"
    >
      {photo ? (
        <img src={photoUrl(photo.url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
          <Icon name="person" className="text-[80px] text-on-surface-variant" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/10" />
    </motion.div>
  );
}

function ActionButtons({ onAct, onRewind }: { onAct: (a: SwipeDir) => void; onRewind: () => void }) {
  return (
    <div className="absolute bottom-[120px] w-full flex justify-center items-center gap-4 z-20">
      <motion.button
        whileTap={{ scale: 0.86 }}
        aria-label="Ortga"
        onClick={onRewind}
        className="w-12 h-12 rounded-full bg-surface-container-lowest clay flex items-center justify-center text-warning"
      >
        <Icon name="undo" className="text-[24px]" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.86 }}
        aria-label="O'tkazish"
        onClick={() => onAct('left')}
        className="w-14 h-14 rounded-full bg-surface-container-lowest clay flex items-center justify-center text-secondary"
      >
        <Icon name="close" className="text-[28px]" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.86 }}
        aria-label="Super Like"
        onClick={() => onAct('up')}
        className="w-12 h-12 rounded-full bg-surface-container-lowest clay flex items-center justify-center text-tertiary"
      >
        <Icon name="star" fill className="text-[24px]" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.86 }}
        aria-label="Yoqtirish"
        onClick={() => onAct('right')}
        className="w-16 h-16 rounded-full bg-primary clay-primary flex items-center justify-center text-white"
      >
        <Icon name="favorite" fill className="text-[32px]" />
      </motion.button>
    </div>
  );
}

function EmptyState({ nearby }: { nearby?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center gap-stack-md px-8">
      <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
        <Icon name={nearby ? 'location_off' : 'favorite'} className="text-[40px]" />
      </div>
      <h2 className="text-headline-md font-headline-md text-on-surface">Hozircha shu</h2>
      <p className="text-body-md font-body-md text-on-surface-variant">
        {nearby
          ? "Atrofingizda hozircha hech kim yo'q. Keyinroq qaytib keling yoki shaharingizni profilingizda ko'rsating."
          : "Keyinroq qaytib keling — yangi insonlar qo'shiladi."}
      </p>
    </div>
  );
}

function MatchOverlay({
  profile,
  onChat,
  onContinue,
}: {
  profile: Profile;
  matchId: string;
  onChat: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] bg-gradient-to-b from-primary/95 to-primary-container/95 backdrop-blur-md flex flex-col justify-center items-center px-margin-main text-center max-w-[480px] mx-auto overflow-hidden"
    >
      <ConfettiBurst />
      
      {/* Orqa fondagi nur / yorug'lik effektlari */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/20 rounded-full blur-[60px] pointer-events-none"
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}
        className="flex items-center justify-center mb-10 relative z-10"
      >
        <div className="w-36 h-36 rounded-full border-[6px] border-surface bg-surface overflow-hidden -mr-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-10">
          {profile.photos[0] ? (
            <img src={photoUrl(profile.photos[0].url)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <Icon name="person" className="text-[56px] text-on-surface-variant" />
            </div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.35 }}
          className="w-36 h-36 rounded-full border-[6px] border-surface bg-gradient-to-tr from-surface-warm to-surface overflow-hidden -ml-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
          <Icon name="favorite" fill className="text-primary text-[56px] drop-shadow-md heartbeat" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mb-12 z-10 relative"
      >
        <h1 className="text-[42px] leading-tight font-headline-lg font-bold text-white mb-2 drop-shadow-lg filter">
          Bu birgalikda!
        </h1>
        <p className="text-[18px] font-body-lg text-white/90 px-4">
          Siz va <span className="font-semibold text-white">{profile.firstName}</span> bir-biringizga yoqdingiz.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full flex flex-col gap-4 z-10 px-4"
      >
        <button
          onClick={onChat}
          className="w-full h-16 rounded-full bg-white text-primary text-[18px] font-bold flex items-center justify-center gap-3 press shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
        >
          <Icon name="chat_bubble" fill className="text-[24px]" /> Xabar yozish
        </button>
        <button
          onClick={onContinue}
          className="w-full h-16 rounded-full border-2 border-white/40 text-white text-[18px] font-semibold press hover:bg-white/10 transition-colors"
        >
          Davom etish
        </button>
      </motion.div>
    </motion.div>
  );
}

// Oddiy konfetti portlashi (match uchun)
function ConfettiBurst() {
  const pieces = Array.from({ length: 24 });
  const colors = ['#fff', '#ffd9d6', '#ffb3ad', '#ffe08a'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.4 + Math.random() * 1.2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
            style={{ left: `${left}%`, width: size, height: size, backgroundColor: color, borderRadius: 2 }}
            className="absolute top-0"
          />
        );
      })}
    </div>
  );
}

function Paywall({
  title,
  message,
  onSubscribe,
  onClose,
}: {
  title: string;
  message: string;
  onSubscribe: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end max-w-[480px] mx-auto"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-surface rounded-t-[28px] p-6 pb-safe-bottom"
      >
        <div className="w-12 h-1.5 bg-on-surface-variant/30 rounded-full mx-auto mb-stack-md" />
        <div className="flex flex-col items-center text-center gap-2 mb-stack-lg">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center text-primary mb-1">
            <Icon name="workspace_premium" fill className="text-[32px]" />
          </div>
          <h2 className="text-headline-md font-headline-md text-on-surface">{title}</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">{message}</p>
        </div>
        <button
          onClick={onSubscribe}
          className="w-full h-[56px] bg-primary text-on-primary rounded-2xl flex items-center justify-center gap-2 font-headline-md text-body-lg press shadow-md mb-2"
        >
          <Icon name="bolt" fill /> Obuna olish
        </button>
        <button onClick={onClose} className="w-full h-[48px] text-on-surface-variant text-label-lg font-label-lg press">
          Keyinroq
        </button>
      </motion.div>
    </motion.div>
  );
}
