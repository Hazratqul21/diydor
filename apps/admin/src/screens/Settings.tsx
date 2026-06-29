import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Config {
  trialDays: number;
  freeSwipesPerDay: number;
  freeSuperLikesPerWeek: number;
  coinToSom: number;
  receiverSharePercent: number;
  minWithdrawSom: number;
}

const FIELDS: { key: keyof Config; label: string; hint: string }[] = [
  { key: 'trialDays', label: 'Bepul sinov (kun)', hint: 'Yangi foydalanuvchiga beriladigan bepul muddat' },
  { key: 'freeSwipesPerDay', label: 'Kunlik bepul yoqtirish', hint: 'Obunasizlar uchun kunlik svayp limiti' },
  { key: 'freeSuperLikesPerWeek', label: 'Haftalik SuperLike', hint: 'Obunasizlar uchun haftalik SuperLike soni' },
  { key: 'coinToSom', label: '1 tanga = so\'m', hint: 'Tanga qiymati (so\'mda)' },
  { key: 'receiverSharePercent', label: 'Sovg\'a ulushi (%)', hint: 'Sovg\'adan oluvchiga tushadigan foiz' },
  { key: 'minWithdrawSom', label: 'Min. yechish (so\'m)', hint: 'Pul yechishning eng kam summasi' },
];

export default function Settings() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Config>('/admin/config').then(setCfg).catch(() => undefined);
  }, []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api<Config>('/admin/config', { method: 'PUT', body: JSON.stringify(cfg) });
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) return <div className="text-black/40">Yuklanmoqda...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold mb-1">Sozlamalar</h1>
      <p className="text-black/50 mb-6">Bu qiymatlar darhol butun ilovaga ta'sir qiladi</p>

      <div className="bg-white rounded-2xl border border-black/5 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-semibold mb-1">{f.label}</label>
            <input
              type="number"
              value={cfg[f.key]}
              onChange={(e) => setCfg({ ...cfg, [f.key]: Number(e.target.value) })}
              className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
            />
            <p className="text-xs text-black/40 mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-brand text-white font-semibold disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Saqlash'}
        </button>
        {saved && (
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Icon name="check_circle" fill className="text-[18px]" /> Saqlandi
          </span>
        )}
      </div>

      <BrandingCard />
      <PaymentConfigCard />
    </div>
  );
}

const ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '');

interface Branding {
  welcomeImageUrl: string | null;
  welcomeTitle: string | null;
  welcomeSubtitle: string | null;
}

function BrandingCard() {
  const [data, setData] = useState<Branding | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Branding>('/admin/config').then((c) => {
      setData(c);
      setTitle(c.welcomeTitle ?? '');
      setSubtitle(c.welcomeSubtitle ?? '');
      setImageUrl(c.welcomeImageUrl ?? null);
    });
  }, []);

  function resolve(url: string | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : ORIGIN + url;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Rasm hajmi 8MB dan oshmasin');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await api<{ welcomeImageUrl: string }>('/admin/branding/welcome-image', {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
      });
      setImageUrl(res.welcomeImageUrl);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api('/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ welcomeTitle: title, welcomeSubtitle: subtitle }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-extrabold mb-1">Kirish ekrani (Welcome)</h2>
      <p className="text-black/50 mb-4 text-sm">
        Foydalanuvchi ilovani ochganda ko'radigan rasm va matn. Istalgan vaqtda o'zgartiring.
      </p>

      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Rasm preview */}
          <div className="shrink-0">
            <div className="w-40 h-52 rounded-2xl bg-black/5 overflow-hidden relative border border-black/10">
              {imageUrl ? (
                <img src={resolve(imageUrl)} alt="Welcome" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/30 text-sm text-center px-2">
                  Standart rasm
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Icon name="progress_activity" className="animate-spin" />
                </div>
              )}
            </div>
            <label className="mt-3 block">
              <span className="h-10 px-4 rounded-xl bg-brand/10 text-brand font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-brand/15">
                <Icon name="upload" className="text-[18px]" /> Rasm yuklash
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="hidden" />
            </label>
          </div>

          {/* Matn */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Sarlavha</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Diydor"
                className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tagsarlavha</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Qalblar uchrashadigan joy"
                className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <p className="text-xs text-black/40">
              Bo'sh qoldirsangiz standart matn ko'rsatiladi. Rasm yuklanishi bilan darhol saqlanadi.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-brand text-white font-semibold disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Icon name="progress_activity" className="animate-spin" /> : 'Matnni saqlash'}
        </button>
        {saved && (
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Icon name="check_circle" fill className="text-[18px]" /> Saqlandi
          </span>
        )}
      </div>
    </div>
  );
}

interface PayCfg {
  paymeMerchantId: string;
  paymeEnv: string;
  paymeCheckoutUrl: string;
  testKeySet: boolean;
  prodKeySet: boolean;
  testKeyTail: string | null;
  prodKeyTail: string | null;
}

function PaymentConfigCard() {
  const [cfg, setCfg] = useState<PayCfg | null>(null);
  const [merchant, setMerchant] = useState('');
  const [env, setEnv] = useState('test');
  const [checkout, setCheckout] = useState('');
  const [keyTest, setKeyTest] = useState('');
  const [keyProd, setKeyProd] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function load() {
    api<PayCfg>('/admin/payment-config').then((c) => {
      setCfg(c);
      setMerchant(c.paymeMerchantId);
      setEnv(c.paymeEnv);
      setCheckout(c.paymeCheckoutUrl);
    });
  }
  useEffect(load, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = {
        paymeMerchantId: merchant,
        paymeEnv: env,
        paymeCheckoutUrl: checkout,
      };
      if (keyTest) body.paymeKeyTest = keyTest;
      if (keyProd) body.paymeKeyProd = keyProd;
      const updated = await api<PayCfg>('/admin/payment-config', { method: 'PUT', body: JSON.stringify(body) });
      setCfg(updated);
      setKeyTest('');
      setKeyProd('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-extrabold mb-1">To'lov rekvizitlari (Payme)</h2>
      <p className="text-black/50 mb-4 text-sm">
        Kalitlar shifrlangan saqlanadi va hech qachon ochiq ko'rsatilmaydi. Bo'sh qoldirsangiz — eski kalit saqlanadi.
      </p>

      <div className="bg-white rounded-2xl border border-black/5 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold mb-1">Merchant ID</label>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Kabinetdan ID"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Muhit</label>
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="test">Test (sandbox)</option>
            <option value="prod">Production</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold mb-1">Checkout URL</label>
          <input
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="https://checkout.paycom.uz"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Test kaliti {cfg.testKeySet && <span className="text-emerald-600 text-xs">({cfg.testKeyTail})</span>}
          </label>
          <input
            type="password"
            value={keyTest}
            onChange={(e) => setKeyTest(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
            placeholder={cfg.testKeySet ? "O'zgartirish uchun yangi kalit" : "Test kaliti"}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Prod kaliti {cfg.prodKeySet && <span className="text-emerald-600 text-xs">({cfg.prodKeyTail})</span>}
          </label>
          <input
            type="password"
            value={keyProd}
            onChange={(e) => setKeyProd(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40"
            placeholder={cfg.prodKeySet ? "O'zgartirish uchun yangi kalit" : 'Prod kaliti'}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-brand text-white font-semibold disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Icon name="progress_activity" className="animate-spin" /> : "To'lov sozlamasini saqlash"}
        </button>
        {saved && (
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Icon name="check_circle" fill className="text-[18px]" /> Saqlandi
          </span>
        )}
      </div>
    </div>
  );
}
