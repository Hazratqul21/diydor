import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { getMe, type Me } from '@/lib/auth';
import { photoUrl } from '@/lib/data';

const INTENT_LABEL: Record<string, string> = {
  SERIOUS: 'Jiddiy munosabatlar',
  FRIENDSHIP: 'Shunchaki muloqot',
  UNSURE: 'Hali bilmayman',
};

export default function MyProfile() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    getMe().then(setMe).catch(() => undefined);
  }, []);

  const primary = me?.photos?.[0];

  return (
    <div className="min-h-screen pb-[100px]">
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex justify-between items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl">
        <h1 className="text-headline-md font-headline-md text-on-surface">Profil</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav('/wallet')}
            aria-label="Hamyon"
            className="h-10 px-3 flex items-center gap-1 rounded-full bg-surface-container/50 press"
          >
            <Icon name="monetization_on" fill className="text-primary text-[20px]" />
            <span className="text-label-sm font-label-sm text-on-surface">{me?.coinBalance ?? 0}</span>
          </button>
          <button
            onClick={() => nav('/settings')}
            aria-label="Sozlamalar"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 press"
          >
            <Icon name="settings" className="text-on-surface" />
          </button>
        </div>
      </header>

      <main className="pt-14">
        {/* Asosiy rasm + ism */}
        <div className="relative w-full aspect-[4/5] bg-surface-container-highest">
          {primary ? (
            <img src={photoUrl(primary.url)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <Icon name="add_a_photo" className="text-[48px]" />
              <span className="text-body-md">Rasm qo'shing</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-margin-main right-margin-main text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-headline-lg font-headline-lg leading-none">
                {me?.firstName ?? '...'}
                {me?.age ? `, ${me.age}` : ''}
              </h2>
              {me?.isVerified && <Icon name="verified" fill className="text-[22px] text-white" />}
            </div>
          </div>
          <button
            onClick={() => nav('/onboarding/photos')}
            className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-surface text-primary flex items-center justify-center shadow-lg press"
            aria-label="Tahrirlash"
          >
            <Icon name="edit" />
          </button>
        </div>

        <div className="px-margin-main py-stack-lg flex flex-col gap-stack-lg">
          {/* Obuna (premium) banneri — ayollar uchun bepul */}
          {me?.gender === 'FEMALE' ? (
            <div className="w-full rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-r from-amber-400/90 to-amber-500/90 text-black shadow-md">
              <Icon name="workspace_premium" fill className="text-[28px]" />
              <div className="text-left flex-1">
                <div className="text-title-md font-headline-md leading-tight">Premium faol</div>
                <div className="text-label-sm font-label-sm opacity-80">Barcha imkoniyatlar siz uchun bepul</div>
              </div>
              <Icon name="check_circle" fill />
            </div>
          ) : (
            <button
              onClick={() => nav('/subscription')}
              className="w-full rounded-2xl p-4 flex items-center gap-3 press bg-gradient-to-r from-amber-400/90 to-amber-500/90 text-black shadow-md"
            >
              <Icon name="workspace_premium" fill className="text-[28px]" />
              <div className="text-left flex-1">
                <div className="text-title-md font-headline-md leading-tight">Diydor Premium</div>
                <div className="text-label-sm font-label-sm opacity-80">Cheksiz yoqtirish, kim yoqtirganini ko'rish</div>
              </div>
              <Icon name="chevron_right" />
            </button>
          )}

          {me?.intent && (
            <Section title="Maqsad">
              <div className="inline-flex items-center gap-2 bg-primary-container/20 px-4 py-2 rounded-xl w-fit">
                <Icon name="favorite" fill className="text-primary text-[20px]" />
                <span className="text-label-sm font-label-sm text-on-primary-container">{INTENT_LABEL[me.intent]}</span>
              </div>
            </Section>
          )}

          <Section title="O'zim haqimda">
            {me?.bio ? (
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{me.bio}</p>
            ) : (
              <button onClick={() => nav('/profile/edit')} className="text-body-md text-primary text-left">
                Bio qo'shish +
              </button>
            )}
          </Section>

          {me?.interests && me.interests.length > 0 && (
            <Section title="Qiziqishlar">
              <div className="flex flex-wrap gap-2">
                {me.interests.map((it) => (
                  <span
                    key={it}
                    className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-low text-label-sm font-label-sm text-on-surface"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Profilni tahrirlash */}
          <button
            onClick={() => nav('/profile/edit')}
            className="w-full h-[52px] rounded-xl border border-outline-variant bg-surface-container-low text-label-lg font-label-lg text-on-surface flex items-center justify-center gap-2 press"
          >
            <Icon name="edit" className="text-[20px]" />
            Profilni tahrirlash
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-stack-sm">
      <h3 className="text-headline-md font-headline-md text-on-surface">{title}</h3>
      {children}
    </div>
  );
}
