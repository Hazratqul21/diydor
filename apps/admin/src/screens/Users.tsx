import { useEffect, useState } from 'react';
import { api, assetUrl } from '../lib/api';
import { Icon } from '../components/Icon';

interface AdminUser {
  id: string;
  firstName: string;
  username: string | null;
  gender: string | null;
  age?: number | null;
  city: string | null;
  isVerified: boolean;
  isBanned: boolean;
  subscriptionTier: string;
  photos: { url: string }[];
  _count?: { reportsReceived: number };
}

export default function Users() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  function load(query = '') {
    setLoading(true);
    api<{ items: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(query)}`)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(u: AdminUser, action: 'ban' | 'unban' | 'verify' | 'unverify') {
    const updated = await api<AdminUser>(`/admin/users/${u.id}/${action}`, { method: 'POST' });
    setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Foydalanuvchilar</h1>
      <p className="text-black/50 mb-6">Qidirish, tasdiqlash va bloklash</p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 text-[20px]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(q)}
            placeholder="Ism yoki username..."
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-white border border-black/5 outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button onClick={() => load(q)} className="h-11 px-5 rounded-xl bg-brand text-white font-semibold">
          Qidirish
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-black/40">Foydalanuvchi topilmadi</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-black/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Foydalanuvchi</th>
                <th className="p-3 font-semibold">Shahar</th>
                <th className="p-3 font-semibold">Obuna</th>
                <th className="p-3 font-semibold">Holat</th>
                <th className="p-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black/10 overflow-hidden shrink-0">
                        {u.photos[0] && <img src={assetUrl(u.photos[0].url)} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1">
                          {u.firstName}
                          {u.isVerified && <Icon name="verified" fill className="text-[14px] text-blue-500" />}
                        </div>
                        <div className="text-black/40 text-xs">{u.username ? `@${u.username}` : u.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-black/60">{u.city || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.subscriptionTier !== 'FREE' ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-black/50'}`}>
                      {u.subscriptionTier}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.isBanned ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Bloklangan</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Faol</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggle(u, u.isVerified ? 'unverify' : 'verify')}
                        title={u.isVerified ? 'Tasdiqni olib tashlash' : 'Tasdiqlash'}
                        className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-blue-600"
                      >
                        <Icon name={u.isVerified ? 'gpp_bad' : 'verified_user'} className="text-[18px]" />
                      </button>
                      <button
                        onClick={() => toggle(u, u.isBanned ? 'unban' : 'ban')}
                        title={u.isBanned ? 'Blokdan chiqarish' : 'Bloklash'}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"
                      >
                        <Icon name={u.isBanned ? 'lock_open' : 'block'} className="text-[18px]" />
                      </button>
                    </div>
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
