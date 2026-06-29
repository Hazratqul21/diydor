import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { whoLikedMe, photoUrl, type WhoLikedMe } from '@/lib/data';

export default function Likes() {
  const nav = useNavigate();
  const [data, setData] = useState<WhoLikedMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    whoLikedMe()
      .then(setData)
      .catch(() => setData({ locked: true, count: 0, items: [] }))
      .finally(() => setLoading(false));
  }, []);

  const count = data?.count ?? 0;
  const locked = data?.locked ?? true;

  return (
    <div className="min-h-screen pb-[100px]">
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl">
        <h1 className="text-headline-md font-headline-md text-on-surface">Sizni yoqtirganlar</h1>
      </header>

      <main className="pt-[72px] px-margin-main">
        {loading ? (
          <div className="grid grid-cols-2 gap-gutter">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : count === 0 ? (
          <Empty />
        ) : locked ? (
          // Gold-gate: son ko'rsatiladi, identifikatsiya yashirin (blur platsahold)
          <>
            <div className="bg-primary-container/20 rounded-2xl p-4 mb-stack-md flex items-center gap-3">
              <Icon name="lock" fill className="text-primary text-[24px]" />
              <p className="text-label-sm font-label-sm text-on-surface flex-1">
                Sizni <b>{count} kishi</b> yoqtirgan. Ularni ko'rish uchun Gold kerak.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-gutter">
              {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-surface-container to-primary-container/30 flex items-center justify-center"
                >
                  <Icon name="favorite" fill className="text-[40px] text-primary/30 blur-[2px]" />
                </div>
              ))}
            </div>
            <button
              onClick={() => nav('/subscription?from=likes')}
              className="mt-stack-lg w-full h-[52px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg press shadow-ambient flex items-center justify-center gap-2"
            >
              <Icon name="workspace_premium" fill className="text-[20px]" />
              Gold bilan ko'rish
            </button>
          </>
        ) : (
          // Gold+: haqiqiy ro'yxat, bosilsa to'liq profil
          <div className="grid grid-cols-2 gap-gutter">
            {data!.items.map((l, i) => (
              <button
                key={i}
                onClick={() => nav(`/u/${l.user.id}`)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container press text-left"
              >
                {l.user.photos[0] ? (
                  <img src={photoUrl(l.user.photos[0].url)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="person" className="text-[40px] text-on-surface-variant" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                  <span className="text-white text-label-md font-label-md">
                    {l.user.firstName}
                    {l.user.age ? `, ${l.user.age}` : ''}
                  </span>
                </div>
                {l.superLike && (
                  <div className="absolute top-2 left-2 bg-tertiary text-on-tertiary rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                    <Icon name="star" fill className="text-[12px]" /> Super
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center text-center gap-stack-md mt-32 px-8">
      <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
        <Icon name="favorite" className="text-[40px]" />
      </div>
      <h2 className="text-headline-md font-headline-md text-on-surface">Hali yoqtirish yo'q</h2>
      <p className="text-body-md font-body-md text-on-surface-variant">
        Faol bo'ling — sizni yoqtirganlar shu yerda paydo bo'ladi.
      </p>
    </div>
  );
}
