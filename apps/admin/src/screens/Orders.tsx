import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Txn {
  id: string;
  state: number;
  performTime: string | number | null;
}
interface Order {
  id: string;
  type: string;
  amount: number; // tiyin
  state: string;
  coins: number;
  subTier: string | null;
  subPeriod: string | null;
  createdAt: string;
  user: { firstName: string; username: string | null };
  transactions: Txn[];
}

const STATE_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// Payme tranzaksiya holati (state) -> yorliq
const TXN_STATE: Record<number, { label: string; cls: string }> = {
  1: { label: 'Yaratilgan', cls: 'bg-sky-100 text-sky-700' },
  2: { label: "To'langan", cls: 'bg-emerald-100 text-emerald-700' },
  [-1]: { label: 'Bekor (yaratilgandan)', cls: 'bg-red-100 text-red-600' },
  [-2]: { label: 'Bekor (to\'langandan)', cls: 'bg-red-100 text-red-600' },
};

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        });
      }}
      title="Nusxa olish"
      className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black/50 align-middle"
    >
      {ok ? '✓' : 'copy'}
    </button>
  );
}

export default function Orders() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Order[] }>('/admin/orders')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">To'lovlar</h1>
      <p className="text-black/50 mb-4">Tanga va obuna buyurtmalari — Payme sandbox uchun Order ID va summa (tiyin) shu yerda</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800">
        <b>Sandbox sinovi:</b> kassa hozir <b>TEST</b> rejimida. Payme kabinetidagi "Тест" bo'limiga
        quyidagi <b>Order ID</b> va <b>Summa (tiyin)</b> ni qo'ying, hamma metodlarni sinab ko'ring.
        Endpoint: <code className="bg-amber-100 px-1 rounded">https://diydorapp.uz/api/payments/payme</code>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-black/40">Buyurtma yo'q</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-black/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Foydalanuvchi</th>
                <th className="p-3 font-semibold">Turi</th>
                <th className="p-3 font-semibold">Order ID (sandbox)</th>
                <th className="p-3 font-semibold">Summa</th>
                <th className="p-3 font-semibold">Holat</th>
                <th className="p-3 font-semibold">Payme tranzaksiya</th>
                <th className="p-3 font-semibold">Sana</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-t border-black/5 align-top">
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {o.user.firstName}
                    {o.user.username && <span className="text-black/40 font-normal"> @{o.user.username}</span>}
                  </td>
                  <td className="p-3 text-black/60 whitespace-nowrap">
                    {o.type === 'SUBSCRIPTION' ? `Obuna ${o.subTier ?? ''} ${o.subPeriod ?? ''}` : `${o.coins} tanga`}
                  </td>
                  <td className="p-3">
                    <code className="text-[12px] bg-black/[0.04] px-1.5 py-0.5 rounded select-all">{o.id}</code>
                    <Copy text={o.id} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold">{(o.amount / 100).toLocaleString('ru-RU')} so'm</div>
                    <div className="text-[11px] text-black/45">
                      {o.amount.toLocaleString('ru-RU')} tiyin <Copy text={String(o.amount)} />
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATE_STYLE[o.state] ?? 'bg-black/5'}`}>
                      {o.state}
                    </span>
                  </td>
                  <td className="p-3">
                    {o.transactions.length === 0 ? (
                      <span className="text-black/30 text-xs">—</span>
                    ) : (
                      o.transactions.map((t) => (
                        <div key={t.id} className="mb-1 last:mb-0">
                          <code className="text-[11px] bg-black/[0.04] px-1 py-0.5 rounded">{t.id}</code>
                          <Copy text={t.id} />
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${TXN_STATE[t.state]?.cls ?? 'bg-black/5'}`}>
                            {TXN_STATE[t.state]?.label ?? `state ${t.state}`}
                          </span>
                        </div>
                      ))
                    )}
                  </td>
                  <td className="p-3 text-black/50 whitespace-nowrap">{new Date(o.createdAt).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
