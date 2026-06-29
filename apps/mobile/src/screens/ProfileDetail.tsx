import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { UserActionsSheet } from '@/components/UserActionsSheet';
import { ApiError } from '@/lib/api';
import { getProfile, swipe, photoUrl, type Profile, type SwipeAction } from '@/lib/data';

const INTENT_LABEL: Record<string, string> = {
  SERIOUS: 'Jiddiy munosabatlar',
  FRIENDSHIP: 'Shunchaki muloqot',
  UNSURE: 'Hali bilmayman',
};

export default function ProfileDetail() {
  const { userId } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<Profile | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (userId) getProfile(userId).then(setP).catch(() => nav(-1));
  }, [userId]);

  async function act(action: SwipeAction) {
    if (!p || busy) return;
    setBusy(true);
    try {
      const res = await swipe(p.id, action);
      if (res.match && res.matchId) {
        nav(`/chat/${res.matchId}`);
        return;
      }
    } catch (e) {
      // Limit tugasa — obunaga yo'naltiramiz (Discover bilan izchil)
      if (e instanceof ApiError && (e.code === 'SWIPE_LIMIT' || e.code === 'SUPERLIKE_LIMIT')) {
        nav('/subscription?from=swipe');
        return;
      }
    }
    nav('/discover');
  }

  if (!p) {
    return <div className="min-h-screen flex items-center justify-center"><Icon name="progress_activity" className="animate-spin text-primary text-[32px]" /></div>;
  }

  const photos = p.photos.length > 0 ? p.photos : [];

  return (
    <div className="min-h-screen pb-32 bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex justify-between items-center px-margin-main h-14 bg-surface/0">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/70 backdrop-blur-md text-on-surface press">
          <Icon name="arrow_back_ios" />
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Boshqa"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/70 backdrop-blur-md text-on-surface press"
        >
          <Icon name="more_vert" />
        </button>
      </header>

      <UserActionsSheet
        userId={p.id}
        userName={p.firstName}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onBlocked={() => nav('/discover')}
      />

      {/* Foto karusel */}
      <div className="relative w-full aspect-[4/5] bg-surface-container-highest">
        {photos[photoIdx] ? (
          <img src={photoUrl(photos[photoIdx].url)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name="person" className="text-[80px]" />
          </div>
        )}
        {/* Tap zonalari */}
        {photos.length > 1 && (
          <>
            <button className="absolute left-0 top-0 h-full w-1/3" onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))} aria-label="Oldingi" />
            <button className="absolute right-0 top-0 h-full w-1/3" onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))} aria-label="Keyingi" />
            <div className="absolute top-16 left-0 right-0 flex justify-center gap-1.5 px-4">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ma'lumot */}
      <div className="px-margin-main pt-stack-lg flex flex-col gap-stack-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface">
              {p.firstName}{p.age ? `, ${p.age}` : ''}
            </h1>
            {p.isVerified && <Icon name="verified" fill className="text-primary text-[24px]" />}
          </div>
          {p.city && (
            <p className="text-body-md font-body-md text-on-surface-variant flex items-center gap-1">
              <Icon name="location_on" className="text-[16px]" /> {p.city}
            </p>
          )}
        </div>

        {p.intent && (
          <div className="flex flex-col gap-stack-sm">
            <h2 className="text-headline-md font-headline-md text-on-surface">Maqsad</h2>
            <div className="inline-flex items-center gap-2 bg-primary-container/20 px-4 py-2 rounded-xl w-fit">
              <Icon name="favorite" fill className="text-primary text-[20px]" />
              <span className="text-label-sm font-label-sm text-on-primary-container">{INTENT_LABEL[p.intent]}</span>
            </div>
          </div>
        )}

        {p.bio && (
          <div className="flex flex-col gap-stack-sm">
            <h2 className="text-headline-md font-headline-md text-on-surface">O'zim haqimda</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{p.bio}</p>
          </div>
        )}

        {p.interests.length > 0 && (
          <div className="flex flex-col gap-stack-sm">
            <h2 className="text-headline-md font-headline-md text-on-surface">Qiziqishlar</h2>
            <div className="flex flex-wrap gap-2">
              {p.interests.map((it) => (
                <span key={it} className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-low text-label-sm font-label-sm text-on-surface">
                  {it}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pastki harakat */}
      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pb-safe-bottom pt-4 bg-surface/80 backdrop-blur-xl flex justify-center items-center gap-6 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <button onClick={() => act('PASS')} disabled={busy} className="w-14 h-14 rounded-full bg-surface-container shadow-md flex items-center justify-center text-secondary press">
          <Icon name="close" className="text-[28px]" />
        </button>
        <button onClick={() => act('SUPERLIKE')} disabled={busy} className="w-12 h-12 rounded-full bg-surface-container shadow-md flex items-center justify-center text-tertiary press">
          <Icon name="star" fill className="text-[24px]" />
        </button>
        <button onClick={() => act('LIKE')} disabled={busy} className="w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center text-white press">
          <Icon name="favorite" fill className="text-[32px]" />
        </button>
      </div>
    </div>
  );
}
