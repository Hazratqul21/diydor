import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Icon } from '@/components/Icon';
import { getPhotos, uploadPhoto, deletePhoto, photoUrl, type Photo } from '@/lib/data';

const SLOTS = 6;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Photos() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPhotos().then(setPhotos).catch(() => undefined);
  }, []);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const photo = await uploadPhoto(dataUrl);
      setPhotos((p) => [...p, photo]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
    await deletePhoto(id).catch(() => undefined);
  }

  const slots = Array.from({ length: SLOTS }, (_, i) => photos[i] ?? null);

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingHeader step={4} total={5} />

      <main className="flex-1 pt-20 px-margin-main pb-32 flex flex-col">
        <div className="mb-stack-lg mt-stack-md text-center">
          <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-stack-sm">
            Rasmlaringizni qo'shing
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant px-2">
            Eng yaxshi suratlaringizni tanlang. Birinchisi asosiy bo'ladi.
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div className="grid grid-cols-3 gap-gutter">
          {slots.map((photo, i) => (
            <div
              key={photo?.id ?? `empty-${i}`}
              className="relative aspect-[3/4] rounded-xl overflow-hidden"
            >
              {photo ? (
                <>
                  <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Asosiy
                    </span>
                  )}
                  <button
                    onClick={() => remove(photo.id)}
                    aria-label="O'chirish"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="w-full h-full bg-surface-subtle border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center text-primary press disabled:opacity-50"
                >
                  <Icon name={busy ? 'progress_activity' : 'add'} className={busy ? 'animate-spin' : 'text-[28px]'} />
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-center text-label-sm text-error mt-stack-md">{error}</p>}

        <div className="flex items-center gap-2 mt-stack-lg justify-center text-on-surface-variant">
          <Icon name="verified_user" fill className="text-[16px] text-primary" />
          <span className="text-label-sm font-label-sm">Rasmlaringiz xavfsiz va tekshiriladi</span>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pb-safe-bottom pt-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <button
          onClick={() => nav('/onboarding/verify')}
          disabled={photos.length < 1}
          className="press w-full h-[56px] rounded-button bg-primary text-on-primary text-body-lg font-body-lg flex items-center justify-center shadow-lift disabled:opacity-50"
        >
          Davom etish
        </button>
      </div>
    </div>
  );
}
