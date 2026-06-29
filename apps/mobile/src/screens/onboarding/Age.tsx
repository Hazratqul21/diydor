import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Icon } from '@/components/Icon';
import { updateProfile } from '@/lib/auth';

function calcAge(iso: string): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export default function Age() {
  const nav = useNavigate();
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = useMemo(() => calcAge(date), [date]);
  const valid = age !== null && age >= 18 && age <= 100;

  async function next() {
    if (!valid) {
      setError("Diydor faqat 18 yoshdan katta foydalanuvchilar uchun");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ birthDate: date });
      nav('/onboarding/intent');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader step={2} total={5} />

      <main className="flex-grow pt-24 px-margin-main flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-2">
            Tug'ilgan sananggiz
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-[300px] mx-auto">
            Diydor 18 yoshdan katta foydalanuvchilar uchun. Yoshingiz profilingizda ko'rsatiladi.
          </p>
        </div>

        <div className="flex flex-col items-center gap-stack-md">
          <div className="w-full bg-surface-subtle rounded-xl h-[64px] flex items-center px-5">
            <Icon name="cake" className="text-primary mr-3" />
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-headline-md font-headline-md text-on-surface"
            />
          </div>

          {age !== null && (
            <div className={`text-body-md font-body-md ${valid ? 'text-on-surface-variant' : 'text-error'}`}>
              {valid ? `Siz ${age} yoshdasiz` : age < 18 ? '18 yoshdan kichiklar ro\'yxatdan o\'ta olmaydi' : 'Sanani tekshiring'}
            </div>
          )}
          {error && <p className="text-label-sm text-error">{error}</p>}
        </div>

        <div className="mt-auto pb-stack-lg">
          <button
            onClick={next}
            disabled={!valid || saving}
            className="press w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg flex items-center justify-center shadow-[0_4px_14px_rgba(190,74,46,0.25)] disabled:opacity-50"
          >
            {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Davom etish'}
          </button>
        </div>
      </main>
    </div>
  );
}
