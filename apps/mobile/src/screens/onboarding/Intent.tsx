import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Icon } from '@/components/Icon';
import { updateProfile, type Intent as IntentT } from '@/lib/auth';

const OPTIONS: {
  value: IntentT;
  title: string;
  desc: string;
  icon: string;
  iconBg: string;
}[] = [
  {
    value: 'SERIOUS',
    title: 'Jiddiy munosabatlar',
    desc: 'Uzoq muddatli munosabatlar qidiryapman',
    icon: 'favorite',
    iconBg: 'group-[.on]:bg-error-container',
  },
  {
    value: 'FRIENDSHIP',
    title: 'Shunchaki muloqot',
    desc: "Yangi do'stlar va suhbatdoshlar topish",
    icon: 'chat_bubble',
    iconBg: 'group-[.on]:bg-tertiary-container/30',
  },
  {
    value: 'UNSURE',
    title: 'Hali bilmayman',
    desc: "Ko'ramiz, nima bo'lishini",
    icon: 'psychology_alt',
    iconBg: 'group-[.on]:bg-secondary-container',
  },
];

export default function Intent() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<IntentT | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function next() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ intent: selected });
      nav('/onboarding/photos');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader step={3} total={5} />

      <main className="flex-1 pt-20 px-margin-main pb-32 flex flex-col">
        <div className="mb-stack-lg mt-stack-md">
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-stack-sm">
            Maqsadingiz nima?
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Sizga eng mos sheriklarni topishimiz uchun maqsadingizni tanlang.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-stack-md">
          {OPTIONS.map((opt) => {
            const on = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`group ${on ? 'on' : ''} press relative w-full h-24 bg-surface-warm rounded-button shadow-ambient p-4 flex items-center gap-4 text-left transition-all duration-300 ${
                  on ? 'ring-2 ring-primary shadow-lift' : 'border border-transparent'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 transition-colors duration-300 ${opt.iconBg}`}
                >
                  <Icon
                    name={opt.icon}
                    fill={on}
                    className={`text-[28px] transition-colors duration-300 ${on ? 'text-primary' : 'text-on-surface-variant'}`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-headline-md font-headline-md transition-colors duration-300 ${on ? 'text-primary' : 'text-on-surface'}`}
                  >
                    {opt.title}
                  </h3>
                  <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">{opt.desc}</p>
                </div>
                <div
                  className={`absolute right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    on
                      ? 'opacity-100 scale-100 bg-primary border-2 border-primary'
                      : 'opacity-0 scale-50 border-2 border-surface-variant'
                  }`}
                >
                  <Icon name="check" fill className="text-on-primary text-[16px]" />
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-center text-label-sm text-error mt-stack-md">{error}</p>}
      </main>

      {/* Pastki harakat */}
      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pb-safe-bottom pt-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <button
          onClick={next}
          disabled={!selected || saving}
          className="press w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg flex items-center justify-center shadow-lift disabled:opacity-50"
        >
          {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Davom etish'}
        </button>
      </div>
    </div>
  );
}
