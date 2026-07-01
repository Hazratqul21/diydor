import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { getGiftCatalog, getWallet, sendGift, type GiftItem, photoUrl } from '@/lib/data';

export default function GiftStore() {
  const { matchId } = useParams();
  const nav = useNavigate();
  const [catalog, setCatalog] = useState<GiftItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<GiftItem | null>(null);

  useEffect(() => {
    getGiftCatalog().then(setCatalog).catch(() => undefined);
    getWallet().then((w) => setBalance(w.coinBalance)).catch(() => undefined);
  }, []);

  async function send(gift: GiftItem) {
    if (!matchId || sending) return;
    if (balance < gift.priceCoins) {
      nav('/coins');
      return;
    }
    setSending(gift.key);
    try {
      const res = await sendGift(matchId, gift.key);
      setBalance(res.coinBalance);
      setSent(gift);
      setTimeout(() => nav(`/chat/${matchId}`), 1400);
    } catch (e) {
      if ((e as Error).message.includes('Tanga')) nav('/coins');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="min-h-screen pb-stack-lg">
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center justify-between px-margin-main h-14 bg-surface/70 backdrop-blur-xl">
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back_ios" fill />
        </button>
        <h1 className="text-headline-md font-headline-md text-on-surface absolute left-1/2 -translate-x-1/2">
          Sovg'alar
        </h1>
        <div className="w-8" />
      </header>

      <main className="pt-[72px] px-margin-main">
        {/* Balans */}
        <button
          onClick={() => nav('/coins')}
          className="w-full rounded-[24px] p-stack-lg flex items-center justify-between bg-surface-warm shadow-ambient press mb-stack-lg"
        >
          <div className="text-left">
            <p className="text-label-sm font-label-sm text-secondary uppercase tracking-wider mb-1">Balans</p>
            <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface">
              <span className="text-primary">{balance}</span> tanga
            </h2>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <Icon name="add" className="text-3xl" />
          </div>
        </button>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-gutter">
          {catalog.map((g) => (
            <div key={g.key} className="rounded-[20px] p-stack-md flex flex-col items-center text-center bg-surface-warm shadow-ambient relative">
              {g.priceCoins >= 100 && (
                <div className="absolute -top-2 -right-2 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-1 rounded-full rotate-12">
                  PREMIUM
                </div>
              )}
              <div className="w-20 h-20 mb-stack-sm rounded-full bg-surface-subtle flex items-center justify-center">
                <img src={photoUrl(g.imageUrl)} alt={g.name} className="w-16 h-16 object-contain drop-shadow-md" />
              </div>
              <h3 className="text-body-lg font-body-lg font-semibold text-on-surface mb-1">{g.name}</h3>
              <p className="text-label-sm font-label-sm text-secondary flex items-center justify-center gap-1">
                <Icon name="monetization_on" fill className="text-[14px] text-primary" /> {g.priceCoins}
              </p>
              <p className="text-[10px] text-tertiary mb-stack-md text-center">
                Oluvchiga: {g.cashoutSom.toLocaleString()} so'm
              </p>
              <button
                onClick={() => send(g)}
                disabled={!!sending}
                className="w-full bg-primary text-on-primary rounded-xl py-2 text-label-sm font-label-sm font-bold press disabled:opacity-60"
              >
                {sending === g.key ? '...' : 'Yuborish'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Yuborildi overlay */}
      {sent && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center max-w-[480px] mx-auto">
          <div className="bg-surface rounded-[28px] p-8 flex flex-col items-center spring-in">
            <img src={photoUrl(sent.imageUrl)} alt={sent.name} className="w-24 h-24 object-contain mb-4 animate-bounce" />
            <p className="text-headline-md font-headline-md text-on-surface text-center">{sent.name} yuborildi!</p>
          </div>
        </div>
      )}
    </div>
  );
}
