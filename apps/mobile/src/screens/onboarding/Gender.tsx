import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Icon } from '@/components/Icon';
import { updateProfile, type Gender as GenderT, type SeekingGender } from '@/lib/auth';

type SeekKey = 'women' | 'men' | 'everyone';

const SEEK_OPTIONS: { key: SeekKey; label: string; value: SeekingGender }[] = [
  { key: 'women', label: 'Ayollarni', value: 'FEMALE' },
  { key: 'men', label: 'Erkaklarni', value: 'MALE' },
  { key: 'everyone', label: 'Hammani', value: 'EVERYONE' },
];

export default function Gender() {
  const nav = useNavigate();
  const [gender, setGender] = useState<GenderT>('MALE');
  const [seek, setSeek] = useState<SeekKey>('women');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function next() {
    setSaving(true);
    setError(null);
    try {
      const seekingGender = SEEK_OPTIONS.find((o) => o.key === seek)!.value;
      await updateProfile({ gender, seekingGender });
      nav('/onboarding/age');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader step={1} total={5} />

      <main className="flex-grow pt-24 px-margin-main pb-safe-bottom flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-2">
            Jinsingizni tanlang
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Bu profilingizda ko'rsatiladi.
          </p>
        </div>

        {/* Jins — segmented control */}
        <div className="mb-stack-lg w-full">
          <div className="relative bg-surface-subtle p-1 rounded-xl flex items-center h-[52px]">
            <div
              className="absolute h-[44px] w-[calc(50%-4px)] bg-surface-warm shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-lg left-1 z-0 transition-transform duration-300"
              style={{
                transform: gender === 'FEMALE' ? 'translateX(100%)' : 'translateX(0)',
                transitionTimingFunction: 'cubic-bezier(0.2,0.8,0.2,1)',
              }}
            />
            {(['MALE', 'FEMALE'] as GenderT[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`relative z-10 w-1/2 h-full flex items-center justify-center text-body-md font-body-md transition-colors duration-200 ${
                  gender === g ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                }`}
              >
                {g === 'MALE' ? 'Erkak' : 'Ayol'}
              </button>
            ))}
          </div>
        </div>

        {/* Kimni qidiryapsiz */}
        <div className="text-center mb-8 mt-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">Kimni qidiryapsiz?</h2>
        </div>

        <div className="space-y-stack-sm w-full">
          {SEEK_OPTIONS.map((opt) => {
            const active = seek === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSeek(opt.key)}
                className={`press w-full h-[56px] rounded-xl border text-body-md font-body-md text-on-surface transition-all duration-200 flex items-center justify-between px-6 ${
                  active ? 'border-primary bg-surface-bright' : 'border-surface-variant bg-surface-warm'
                }`}
              >
                <span>{opt.label}</span>
                <Icon
                  name="check_circle"
                  fill={active}
                  className={`text-primary transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                />
              </button>
            );
          })}
        </div>

        {error && <p className="text-center text-label-sm text-error mt-stack-md">{error}</p>}

        <div className="mt-auto pt-stack-lg pb-stack-lg">
          <button
            onClick={next}
            disabled={saving}
            className="press w-full h-[56px] rounded-xl bg-primary text-on-primary text-body-lg font-body-lg shadow-[0_4px_14px_rgba(167,56,51,0.25)] flex items-center justify-center disabled:opacity-60"
          >
            {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Davom etish'}
          </button>
        </div>
      </main>
    </div>
  );
}
