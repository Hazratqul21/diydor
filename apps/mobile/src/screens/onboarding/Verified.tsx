import { useNavigate } from 'react-router-dom';

export default function Verified() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-margin-main text-center relative overflow-hidden">
      <div className="spring-in flex flex-col items-center mb-10">
        <div className="w-32 h-32 rounded-full bg-success-container flex items-center justify-center shadow-glow relative">
          <div className="absolute inset-0 rounded-full border border-success/20 scale-110" />
          <div className="absolute inset-0 rounded-full border border-success/10 scale-125" />
          <svg className="w-16 h-16 text-success" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <polyline
              points="20 6 9 17 4 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'dash 0.9s ease 0.3s forwards' }}
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4 max-w-[280px] fade-in-up-d1">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Tasdiqlandi</h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant">
          Profilingiz muvaffaqiyatli verifikatsiyadan o'tdi
        </p>
      </div>

      <div className="w-full mt-12 fade-in-up-d2 px-2">
        <button
          onClick={() => nav('/discover')}
          className="w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg flex items-center justify-center shadow-ambient press"
        >
          Boshladik
        </button>
      </div>

      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}
