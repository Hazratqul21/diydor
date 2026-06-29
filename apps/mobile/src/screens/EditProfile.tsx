import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { getMe, updateProfile, type Me } from '@/lib/auth';

// Mashhur qiziqishlar (Discover ikonkalari bilan mos)
const INTEREST_OPTIONS = [
  'Qahva', 'Kofe', "San'at", 'Sayohat', 'Kitoblar', 'Musiqa',
  'Sport', 'Kino', 'Tabiat', 'Biznes', 'Oshpazlik', 'Fotosurat',
];

const CITY_OPTIONS = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', "Farg'ona",
  'Nukus', 'Qarshi', 'Navoiy', 'Jizzax', 'Termiz', 'Urganch', 'Guliston',
];

export default function EditProfile() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((m) => {
        setMe(m);
        setBio(m.bio ?? '');
        setCity(m.city ?? '');
        setInterests(m.interests ?? []);
      })
      .catch(() => undefined);
  }, []);

  function toggleInterest(it: string) {
    setInterests((prev) =>
      prev.includes(it) ? prev.filter((x) => x !== it) : prev.length >= 10 ? prev : [...prev, it],
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ bio: bio.trim(), city: city || undefined, interests });
      nav('/profile');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="progress_activity" className="animate-spin text-primary text-[32px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-50 flex items-center justify-between px-margin-main h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/50">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">
          Profilni tahrirlash
        </h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 px-margin-main pt-stack-lg pb-32 flex flex-col gap-stack-lg">
        {/* Bio */}
        <div className="flex flex-col gap-stack-sm">
          <label className="text-label-sm font-label-sm text-on-surface-variant px-1">O'zim haqimda</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="O'zingiz haqingizda qisqacha yozing..."
            rows={4}
            className="w-full bg-surface-subtle rounded-xl p-4 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <span className="text-label-sm text-on-surface-variant/70 self-end pr-1">{bio.length}/500</span>
        </div>

        {/* Shahar */}
        <div className="flex flex-col gap-stack-sm">
          <label className="text-label-sm font-label-sm text-on-surface-variant px-1">Shahar</label>
          <div className="relative">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-surface-subtle rounded-xl p-4 pr-10 text-body-md font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              <option value="">Tanlanmagan</option>
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          </div>
          <p className="text-label-sm text-on-surface-variant/70 px-1">
            "Yaqin atrofda" bo'limida shaharingizdagi insonlar ko'rsatiladi.
          </p>
        </div>

        {/* Qiziqishlar */}
        <div className="flex flex-col gap-stack-sm">
          <label className="text-label-sm font-label-sm text-on-surface-variant px-1">
            Qiziqishlar ({interests.length}/10)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((it) => {
              const on = interests.includes(it);
              return (
                <button
                  key={it}
                  onClick={() => toggleInterest(it)}
                  className={`px-4 py-2 rounded-full border text-label-sm font-label-sm press transition-colors ${
                    on
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface-container-low text-on-surface'
                  }`}
                >
                  {it}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-center text-label-sm text-error">{error}</p>}
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pt-4 pb-safe-bottom bg-gradient-to-t from-background via-background/95 to-transparent z-40">
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-[56px] bg-primary text-on-primary text-body-lg font-semibold rounded-xl flex items-center justify-center press shadow-md disabled:opacity-60"
        >
          {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
