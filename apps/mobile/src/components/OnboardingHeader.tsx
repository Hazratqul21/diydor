import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

interface Props {
  /** Joriy qadam (1 dan boshlab) */
  step: number;
  /** Umumiy qadamlar soni */
  total: number;
}

/**
 * Yagona onboarding sarlavhasi — orqaga tugmasi + izchil segmentli progress.
 * (Kritikadagi tuzatish: majburiy qadamlarda "Skip" yo'q, progress bitta uslubda.)
 */
export function OnboardingHeader({ step, total }: Props) {
  const nav = useNavigate();
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl max-w-[480px] mx-auto">
      <button
        onClick={() => nav(-1)}
        aria-label="Orqaga"
        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full press text-on-surface shrink-0"
      >
        <Icon name="arrow_back_ios" />
      </button>
      <div className="flex-1 px-4 flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i < step ? 'bg-primary' : 'bg-surface-variant'
            }`}
          />
        ))}
      </div>
      <div className="w-10 shrink-0" />
    </header>
  );
}
