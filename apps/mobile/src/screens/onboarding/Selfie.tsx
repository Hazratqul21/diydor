import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { verifySelfie } from '@/lib/data';

export default function Selfie() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setErrorMsg('Kameraga ruxsat berilmadi yoki kamera topilmadi.');
      }
    }
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function capture() {
    if (!videoRef.current) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas xatosi');
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) throw new Error('Rasm olinmadi');
      
      await verifySelfie(blob);
      nav('/onboarding/done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verifikatsiyadan o\'ta olmadingiz. Qayta urinib ko\'ring.');
      setBusy(false);
    }
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-platinum-dark text-white">
      {/* Kamera fon */}
      <div className="absolute inset-0 bg-surface-dim flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="min-w-full min-h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Oval qo'llanma */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-6vh' }}>
        <div
          className="w-[260px] h-[340px] rounded-[50%] border-[3px] border-dashed border-white/90 relative"
          style={{ boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)', animation: 'springIn 0.5s ease' }}
        >
           {/* Scan animation line */}
           <div className="absolute w-full h-[2px] bg-primary top-0 shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
        </div>
      </div>

      {/* Sarlavha */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center h-14 px-margin-main">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="w-10 h-10 -ml-2 flex items-center press">
          <Icon name="arrow_back_ios" />
        </button>
      </header>

      <div className="relative z-10 pt-20 px-margin-main text-center">
        <h1 className="text-headline-md font-headline-md drop-shadow">Yuzingizni oval ichiga joylashtiring</h1>
        <p className="text-body-md font-body-md text-white/90 mt-stack-sm drop-shadow">
          Bu profilingiz xavfsizligini ta'minlaydi
        </p>
        {errorMsg && (
          <div className="bg-error/90 text-on-error px-4 py-2 rounded-xl mt-4 max-w-[80%] mx-auto text-sm backdrop-blur-md">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Pastki boshqaruv */}
      <div className="absolute bottom-0 w-full max-w-[480px] mx-auto z-10 flex flex-col items-center pb-stack-lg">
        <div className="mb-stack-lg bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-2">
          <Icon name="sentiment_satisfied" fill />
          <span className="text-body-md font-body-md font-medium">Tabassum qiling</span>
        </div>
        <button
          onClick={capture}
          disabled={busy}
          aria-label="Suratga olish"
          className="w-[84px] h-[84px] rounded-full border-4 border-white/80 flex items-center justify-center press disabled:opacity-60"
        >
          <div className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center">
            {busy && <Icon name="progress_activity" className="animate-spin text-primary" />}
          </div>
        </button>
        <p className="text-label-caps font-label-caps text-white/70 mt-stack-md uppercase tracking-widest">
          Suratga olish
        </p>
      </div>
    </div>
  );
}
