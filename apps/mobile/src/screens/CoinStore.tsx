import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { getCoinPackages, createCoinOrder, type CoinPackage } from '@/lib/data';

// Hozircha faqat Payme ishlaydi. Click/Stars integratsiyasi qo'shilgach kengaytiriladi.
const METHODS = [
  { key: 'payme', label: 'Payme', icon: 'account_balance_wallet' },
];

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

export default function CoinStore() {
  const nav = useNavigate();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [method, setMethod] = useState('payme');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getCoinPackages().then((p) => {
      setPackages(p);
      setSelected(p.find((x) => x.popular)?.id ?? p[0]?.id ?? '');
    });
  }, []);

  async function buy() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      // Order yaratiladi -> Payme checkout sahifasiga yo'naltiriladi.
      // To'lovdan keyin Payme PerformTransaction chaqiradi va tanga qo'shiladi.
      const order = await createCoinOrder(selected);
      window.location.href = order.checkoutUrl;
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-[100px]">
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center justify-between px-margin-main h-14 bg-surface/70 backdrop-blur-xl border-b border-surface-variant/30">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">
          Tanga sotib olish
        </h1>
        <div className="w-8" />
      </header>

      <main className="pt-20 px-margin-main">
        <div className="text-center mb-stack-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container/20 text-primary mb-stack-sm">
            <Icon name="monetization_on" fill className="text-[40px]" />
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-[280px] mx-auto">
            Hisobingizni to'ldiring va sovg'alar yuboring.
          </p>
        </div>

        <div className="space-y-stack-sm mb-stack-lg">
          {packages.map((p) => {
            const on = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 press relative overflow-hidden transition-colors ${
                  on ? 'border-primary bg-primary-fixed/30' : 'border-transparent bg-surface-container'
                }`}
              >
                {p.popular && (
                  <span className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg text-[10px] font-bold uppercase">
                    Eng mashhur
                  </span>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center shrink-0">
                    <Icon name="monetization_on" fill className="text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-body-lg font-headline-md text-on-surface">{p.coins} tanga</div>
                    {p.bonus > 0 && <div className="text-label-sm font-label-sm text-primary font-medium">+ {p.bonus} bonus</div>}
                  </div>
                </div>
                <div className="text-body-lg font-headline-md text-on-surface">{fmt(p.priceSom)} so'm</div>
              </button>
            );
          })}
        </div>

        <h3 className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider pl-1 mb-stack-sm">
          To'lov usuli
        </h3>
        <div className="grid grid-cols-1 gap-3 mb-2">
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border h-[72px] press transition-colors ${
                  on ? 'border-primary bg-primary-fixed/30' : 'border-surface-variant bg-surface-container'
                }`}
              >
                <Icon name={m.icon} fill className={`mb-1 ${m.key === 'stars' ? 'text-[#F7D24D]' : 'text-on-surface'}`} />
                <span className="text-[11px] font-semibold text-on-surface">{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-on-surface-variant text-center mt-2">
          To'lov Payme orqali xavfsiz amalga oshiriladi.
        </p>
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pb-safe-bottom pt-4 bg-surface/80 backdrop-blur-md border-t border-surface-variant/20">
        <button
          onClick={buy}
          disabled={busy || !selected}
          className="w-full h-[56px] bg-primary text-on-primary rounded-2xl flex items-center justify-center gap-2 font-headline-md text-body-lg press shadow-md disabled:opacity-60"
        >
          {busy ? <Icon name="progress_activity" className="animate-spin" /> : <><Icon name="shopping_cart_checkout" /> Sotib olish</>}
        </button>
      </div>

      {done && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center max-w-[480px] mx-auto">
          <div className="bg-surface rounded-[28px] p-8 flex flex-col items-center spring-in">
            <Icon name="check_circle" fill className="text-success text-[56px] mb-2" />
            <p className="text-headline-md font-headline-md text-on-surface">Tangalar qo'shildi!</p>
          </div>
        </div>
      )}
    </div>
  );
}
