import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { firstName: string };
  reported: { id: string; firstName: string; isBanned: boolean };
}

export default function Reports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ items: Report[] }>('/admin/reports')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function ban(userId: string) {
    await api(`/admin/users/${userId}/ban`, { method: 'POST' });
    load();
  }
  async function resolve(id: string) {
    await api(`/admin/reports/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Shikoyatlar</h1>
      <p className="text-black/50 mb-6">Foydalanuvchi shikoyatlarini ko'rib chiqish</p>

      {loading ? (
        <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-black/40">
          <Icon name="check_circle" className="text-[40px] text-emerald-500 mb-2" />
          <p>Ochiq shikoyatlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-black/5 p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Icon name="flag" fill className="text-[20px]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  {r.reported.firstName}
                  {r.reported.isBanned && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Bloklangan</span>
                  )}
                </div>
                <div className="text-sm text-black/60 mt-0.5">
                  Sabab: <b>{r.reason}</b>
                  {r.details ? ` — ${r.details}` : ''}
                </div>
                <div className="text-xs text-black/40 mt-1">
                  {r.reporter.firstName} shikoyat qildi · {new Date(r.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!r.reported.isBanned && (
                  <button
                    onClick={() => ban(r.reported.id)}
                    className="h-9 px-3 rounded-lg bg-red-600 text-white text-sm font-semibold"
                  >
                    Bloklash
                  </button>
                )}
                <button
                  onClick={() => resolve(r.id)}
                  className="h-9 px-3 rounded-lg bg-black/5 text-black/70 text-sm font-semibold"
                >
                  Yopish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
