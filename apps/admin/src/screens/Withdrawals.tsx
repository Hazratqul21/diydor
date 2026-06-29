import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Withdrawal {
  id: string;
  amountSom: number;
  cardNumber: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  note: string | null;
  createdAt: string;
  user: { id: string; firstName: string; username: string | null; gender: string | null };
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function fmtCard(c: string) {
  return c.replace(/(.{4})/g, '$1 ').trim();
}

export default function Withdrawals() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  function load() {
    setLoading(true);
    api<{ items: Withdrawal[] }>('/admin/withdrawals')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function act(id: string, action: 'paid' | 'reject') {
    if (action === 'reject' && !confirm("Rad etilsa, mablag' foydalanuvchi hamyoniga qaytariladi. Davom etamizmi?")) return;
    setBusy(id);
    try {
      await api(`/admin/withdrawals/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) });
      load();
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Pul yechish so'rovlari</h1>
      <p className="text-black/50 mb-6">Kartaga qo'lda o'tkazib, "To'landi" deb belgilang</p>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-black/40">
            <Icon name="account_balance_wallet" className="text-[40px] mb-2" />
            <p>So'rovlar yo'q</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-black/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Foydalanuvchi</th>
                <th className="p-3 font-semibold">Karta</th>
                <th className="p-3 font-semibold">Summa</th>
                <th className="p-3 font-semibold">Holat</th>
                <th className="p-3 font-semibold">Sana</th>
                <th className="p-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-t border-black/5">
                  <td className="p-3 font-semibold">
                    {w.user.firstName}
                    {w.user.username && <span className="text-black/40 font-normal"> @{w.user.username}</span>}
                  </td>
                  <td className="p-3 font-mono">{fmtCard(w.cardNumber)}</td>
                  <td className="p-3 font-bold">{w.amountSom.toLocaleString('ru-RU')} so'm</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-black/50">{new Date(w.createdAt).toLocaleString('ru-RU')}</td>
                  <td className="p-3 text-right">
                    {w.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => act(w.id, 'paid')}
                          disabled={busy === w.id}
                          className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
                        >
                          To'landi
                        </button>
                        <button
                          onClick={() => act(w.id, 'reject')}
                          disabled={busy === w.id}
                          className="h-9 px-3 rounded-lg bg-black/5 text-red-600 text-sm font-semibold disabled:opacity-60"
                        >
                          Rad etish
                        </button>
                      </div>
                    ) : (
                      <span className="text-black/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
