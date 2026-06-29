import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { getWallet, withdraw } from '@/lib/data';

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

export default function Withdraw() {
  const nav = useNavigate();
  const [balance, setBalance] = useState(0);
  const [minWithdraw, setMinWithdraw] = useState(50_000);
  const [card, setCard] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getWallet()
      .then((w) => {
        setBalance(w.walletBalance);
        if (w.minWithdrawSom) setMinWithdraw(w.minWithdrawSom);
      })
      .catch(() => undefined);
  }, []);

  function setCardFmt(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    setCard(digits.replace(/(.{4})/g, '$1 ').trim());
  }

  async function submit() {
    setError(null);
    const amt = Number(amount);
    if (card.replace(/\s/g, '').length < 16) return setError('Karta raqamini to\'liq kiriting');
    if (!amt || amt < minWithdraw) return setError(`Minimal summa ${fmt(minWithdraw)} so'm`);
    if (amt > balance) return setError('Balans yetarli emas');
    setBusy(true);
    try {
      await withdraw(card.replace(/\s/g, ''), amt);
      setDone(true);
      setTimeout(() => nav('/wallet'), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const CHIPS = [50_000, 100_000, 200_000];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-margin-main h-14 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/50">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="w-10 h-10 -ml-2 flex items-center text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">Pulni yechish</h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 px-margin-main pt-stack-lg pb-32 flex flex-col gap-stack-lg">
        {/* Karta */}
        <div className="flex flex-col gap-stack-sm">
          <label className="text-label-sm font-label-sm text-secondary px-1">Karta raqami</label>
          <div className="flex items-center bg-surface-subtle rounded-xl h-[56px] px-4">
            <input
              inputMode="numeric"
              value={card}
              onChange={(e) => setCardFmt(e.target.value)}
              placeholder="8600 0000 0000 0000"
              className="flex-1 bg-transparent border-none focus:ring-0 text-body-lg font-body-lg text-on-surface outline-none placeholder:text-secondary-fixed-dim"
            />
            <Icon name="credit_card" className="text-secondary" />
          </div>
        </div>

        {/* Summa */}
        <div className="flex flex-col gap-stack-sm">
          <label className="text-label-sm font-label-sm text-secondary px-1">Yechiladigan summa</label>
          <div className="bg-surface-subtle rounded-xl p-4">
            <div className="flex items-center">
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-headline-lg-mobile font-headline-lg-mobile text-on-surface outline-none p-0 placeholder:text-secondary-fixed-dim"
              />
              <span className="text-headline-md font-headline-md text-secondary ml-3 shrink-0">so'm</span>
            </div>
            <div className="h-px w-full bg-surface-container-high my-3" />
            <div className="flex justify-between text-label-sm font-label-sm text-secondary">
              <span>Mavjud balans:</span>
              <span className="text-on-surface font-semibold">{fmt(balance)} so'm</span>
            </div>
          </div>
          <div className="flex gap-2 mt-1 overflow-x-auto no-scrollbar">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setAmount(String(c))}
                className="px-4 py-2.5 rounded-full bg-surface-container text-label-sm font-label-sm text-on-surface whitespace-nowrap press"
              >
                {fmt(c)}
              </button>
            ))}
            <button
              onClick={() => setAmount(String(balance))}
              className="px-4 py-2.5 rounded-full bg-surface-container text-label-sm font-label-sm text-on-surface whitespace-nowrap press"
            >
              Barchasi
            </button>
          </div>
        </div>

        {/* KYC eslatma */}
        <div className="bg-secondary-container/30 rounded-xl p-4 flex gap-3 items-start border border-secondary-container">
          <Icon name="shield_person" fill className="text-secondary text-[20px] mt-0.5" />
          <div>
            <h3 className="text-label-sm font-label-sm text-on-surface font-semibold">Limitlar va xavfsizlik</h3>
            <p className="text-[13px] leading-[18px] text-secondary mt-1">
              Pul yechish litsenziyali to'lov tizimi orqali amalga oshiriladi. Katta summalar uchun shaxsni
              tasdiqlash (KYC) talab qilinadi.
            </p>
          </div>
        </div>

        {error && <p className="text-center text-label-sm text-error">{error}</p>}
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto px-margin-main pt-4 pb-safe-bottom bg-gradient-to-t from-background via-background/95 to-transparent z-40">
        <button
          onClick={submit}
          disabled={busy}
          className="w-full h-[56px] bg-primary text-on-primary text-body-lg font-semibold rounded-xl flex items-center justify-center press shadow-md disabled:opacity-60"
        >
          {busy ? <Icon name="progress_activity" className="animate-spin" /> : 'Tasdiqlash'}
        </button>
      </div>

      {done && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center max-w-[480px] mx-auto">
          <div className="bg-surface rounded-[28px] p-8 flex flex-col items-center spring-in text-center">
            <Icon name="check_circle" fill className="text-success text-[56px] mb-2" />
            <p className="text-headline-md font-headline-md text-on-surface">So'rov qabul qilindi</p>
            <p className="text-body-md text-on-surface-variant mt-1">Pul tez orada kartangizga o'tkaziladi</p>
          </div>
        </div>
      )}
    </div>
  );
}
