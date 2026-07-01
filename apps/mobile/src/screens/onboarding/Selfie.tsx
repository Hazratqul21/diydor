import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { verifySelfie } from '@/lib/data';

type Phase = 'loading' | 'camera' | 'preview' | 'verifying' | 'fallback';

export default function Selfie() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [shotUrl, setShotUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotBlobRef = useRef<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg('');
    setPhase('loading');
    // getUserMedia mavjud emas (eski Telegram WebView / ruxsatsiz) -> native kamera
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('fallback');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS/Telegram: metadata yuklanmaguncha videoWidth 0 bo'ladi
        await videoRef.current.play().catch(() => undefined);
      }
      setPhase('camera');
    } catch (err: any) {
      // Ruxsat berilmadi yoki kamera yo'q -> native kameradan olishga taklif
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      setErrorMsg(
        denied
          ? 'Kameraga ruxsat berilmadi. Pastdagi tugma orqali suratga oling.'
          : 'Kamera topilmadi. Pastdagi tugma orqali suratga oling.',
      );
      setPhase('fallback');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (shotUrl) URL.revokeObjectURL(shotUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function usePreview(blob: Blob) {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotBlobRef.current = blob;
    setShotUrl(URL.createObjectURL(blob));
    setPhase('preview');
  }

  // ── Kameradan kadr olish ──
  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) {
      setErrorMsg('Kamera hali tayyor emas. Bir lahza kuting.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas xatosi');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Rasm olinmadi');
      stopCamera();
      usePreview(blob);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rasm olishda xatolik. Qayta urinib ko\'ring.');
    }
  }

  // ── Native kamera (fallback) ──
  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Iltimos, rasm tanlang.');
      return;
    }
    usePreview(file);
  }

  // ── Tasdiqlash: serverga yuborish + verifikatsiya ──
  async function confirm() {
    const blob = shotBlobRef.current;
    if (!blob) return;
    setPhase('verifying');
    setErrorMsg('');
    try {
      await verifySelfie(blob);
      nav('/onboarding/done', { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verifikatsiyadan o\'ta olmadingiz. Qayta urinib ko\'ring.');
      setPhase('preview');
    }
  }

  // ── Qayta olish ──
  function retake() {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    setShotUrl(null);
    shotBlobRef.current = null;
    setErrorMsg('');
    startCamera();
  }

  const showPreview = phase === 'preview' || phase === 'verifying';

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-platinum-dark text-white">
      {/* Kamera / preview fon */}
      <div className="absolute inset-0 bg-surface-dim flex items-center justify-center overflow-hidden">
        {showPreview && shotUrl ? (
          <img src={shotUrl} alt="Selfie" className="min-w-full min-h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="min-w-full min-h-full object-cover -scale-x-100"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Oval qo'llanma (kamera/preview paytida) */}
      {phase !== 'fallback' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-6vh' }}>
          <div
            className={`w-[260px] h-[340px] rounded-[50%] border-[3px] border-dashed relative transition-colors ${
              showPreview ? 'border-success/90' : 'border-white/90'
            }`}
            style={{ boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)', animation: 'springIn 0.5s ease' }}
          >
            {phase === 'camera' && (
              <div className="absolute w-full h-[2px] bg-primary shadow-[0_0_8px_rgba(255,255,255,0.8)] scanline" />
            )}
          </div>
        </div>
      )}

      {/* Sarlavha */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center h-14 px-margin-main">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="w-10 h-10 -ml-2 flex items-center press">
          <Icon name="arrow_back_ios" />
        </button>
      </header>

      <div className="relative z-10 pt-20 px-margin-main text-center">
        <h1 className="text-headline-md font-headline-md drop-shadow">
          {showPreview ? 'Surat yaxshi chiqdimi?' : 'Yuzingizni oval ichiga joylashtiring'}
        </h1>
        <p className="text-body-md font-body-md text-white/90 mt-stack-sm drop-shadow">
          {showPreview
            ? 'Yuzingiz aniq ko\'rinsa, tasdiqlang'
            : 'Bu profilingiz xavfsizligini ta\'minlaydi'}
        </p>
        {errorMsg && (
          <div className="bg-error/90 text-on-error px-4 py-2.5 rounded-xl mt-4 max-w-[85%] mx-auto text-sm backdrop-blur-md shadow-lg">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Native kamera input (fallback) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onFilePicked}
      />

      {/* Pastki boshqaruv */}
      <div className="absolute bottom-0 w-full max-w-[480px] mx-auto z-10 flex flex-col items-center pb-stack-lg px-margin-main">
        {/* Loading */}
        {phase === 'loading' && (
          <div className="mb-stack-lg flex items-center gap-2 text-white/80">
            <Icon name="progress_activity" className="animate-spin" />
            <span className="text-body-md font-body-md">Kamera tayyorlanmoqda…</span>
          </div>
        )}

        {/* Kamera: suratga olish tugmasi */}
        {phase === 'camera' && (
          <>
            <div className="mb-stack-lg bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-2">
              <Icon name="sentiment_satisfied" fill />
              <span className="text-body-md font-body-md font-medium">Tabassum qiling</span>
            </div>
            <button
              onClick={capture}
              aria-label="Suratga olish"
              className="w-[84px] h-[84px] rounded-full border-4 border-white/80 flex items-center justify-center press"
            >
              <div className="w-[68px] h-[68px] rounded-full bg-white" />
            </button>
            <p className="text-label-caps font-label-caps text-white/70 mt-stack-md uppercase tracking-widest">
              Suratga olish
            </p>
          </>
        )}

        {/* Fallback: native kamera tugmasi */}
        {phase === 'fallback' && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-[56px] rounded-button bg-white text-platinum-dark text-body-lg font-body-lg font-semibold flex items-center justify-center gap-2 press shadow-lift"
          >
            <Icon name="photo_camera" fill />
            Suratga olish
          </button>
        )}

        {/* Preview: Tasdiqlash / Qayta olish */}
        {showPreview && (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={confirm}
              disabled={phase === 'verifying'}
              className="w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg font-semibold flex items-center justify-center gap-2 press shadow-lift disabled:opacity-70"
            >
              {phase === 'verifying' ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Tekshirilmoqda…
                </>
              ) : (
                <>
                  <Icon name="check" />
                  Tasdiqlash
                </>
              )}
            </button>
            <button
              onClick={retake}
              disabled={phase === 'verifying'}
              className="w-full h-[52px] rounded-button bg-white/15 backdrop-blur-md border border-white/25 text-white text-body-md font-body-md flex items-center justify-center gap-2 press disabled:opacity-50"
            >
              <Icon name="refresh" />
              Qayta olish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
