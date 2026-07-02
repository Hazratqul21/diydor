import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Referral {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  joined: number;
  verified: number;
  link: string;
  webLink: string;
}

export default function Referrals() {
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  // Yangi referal formasi
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    api<Referral[]>('/admin/referrals')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      await api('/admin/referrals', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), ...(code.trim() ? { code: code.trim() } : {}) }),
      });
      setName('');
      setCode('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Eski brauzer / ruxsatsiz kontekst uchun zaxira
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  }

  async function toggle(id: string) {
    setBusy(id);
    try {
      await api(`/admin/referrals/${id}/toggle`, { method: 'POST', body: JSON.stringify({}) });
      load();
    } finally {
      setBusy('');
    }
  }

  async function remove(id: string, joined: number) {
    const warn =
      joined > 0
        ? `Bu kodga ${joined} ta foydalanuvchi bog'langan — o'chirilsa ular statistikadan chiqadi. O'chiramizmi?`
        : "Kod o'chirilsinmi?";
    if (!confirm(warn)) return;
    setBusy(id);
    try {
      await api(`/admin/referrals/${id}`, { method: 'DELETE' });
      load();
    } finally {
      setBusy('');
    }
  }

  const totalJoined = items.reduce((s, r) => s + r.joined, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Referal linklar</h1>
      <p className="text-black/50 mb-6">
        Promouterlar uchun link yarating — kim nechta odam olib kelganini kuzating
      </p>

      {/* Yangi link yaratish */}
      <form
        onSubmit={create}
        className="bg-white rounded-2xl border border-black/5 p-5 mb-6 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-black/50 mb-1.5">
            Promouter ismi / izoh *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Aziz (Instagram)"
            required
            minLength={2}
            maxLength={60}
            className="w-full h-11 px-3 rounded-xl border border-black/10 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-sm"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-black/50 mb-1.5">
            Kod (ixtiyoriy, bo'sh = avto)
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="masalan: aziz"
            maxLength={32}
            className="w-full h-11 px-3 rounded-xl border border-black/10 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-sm font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={creating || name.trim().length < 2}
          className="h-11 px-5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          <Icon name="add_link" className="text-[18px]" />
          {creating ? 'Yaratilmoqda…' : 'Link yaratish'}
        </button>
        {error && <p className="w-full text-sm text-red-600 font-medium">{error}</p>}
      </form>

      {/* Umumiy hisob */}
      {items.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm text-black/60">
          <span>
            Jami linklar: <b className="text-black">{items.length}</b>
          </span>
          <span>
            Jami kelganlar: <b className="text-black">{totalJoined}</b>
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-black/40">
            <Icon name="share" className="text-[40px] mb-2" />
            <p>Hali referal link yo'q — yuqorida birinchisini yarating</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-black/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Promouter</th>
                <th className="p-3 font-semibold">Kod</th>
                <th className="p-3 font-semibold">Link</th>
                <th className="p-3 font-semibold text-center">Kelganlar</th>
                <th className="p-3 font-semibold text-center">Tasdiqlangan</th>
                <th className="p-3 font-semibold">Holat</th>
                <th className="p-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className={`border-t border-black/5 ${r.isActive ? '' : 'opacity-50'}`}>
                  <td className="p-3 font-semibold">
                    {r.name}
                    <div className="text-xs text-black/40 font-normal">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="p-3 font-mono">{r.code}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-black/60 max-w-[220px] truncate">
                        {r.link}
                      </span>
                      <button
                        onClick={() => copy(r.link, r.id)}
                        title="Telegram linkni nusxalash"
                        className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${
                          copied === r.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-black/5 hover:bg-black/10 text-black/70'
                        }`}
                      >
                        <Icon name={copied === r.id ? 'check' : 'content_copy'} className="text-[14px]" />
                        {copied === r.id ? 'Nusxalandi' : 'Nusxalash'}
                      </button>
                      <button
                        onClick={() => copy(r.webLink, r.id + '_web')}
                        title="Veb (brauzer) linkni nusxalash"
                        className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${
                          copied === r.id + '_web'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-black/5 hover:bg-black/10 text-black/70'
                        }`}
                      >
                        <Icon name={copied === r.id + '_web' ? 'check' : 'language'} className="text-[14px]" />
                        {copied === r.id + '_web' ? 'Nusxalandi' : 'Veb'}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold">{r.joined}</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-700 font-bold">{r.verified}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-black/10 text-black/50'
                      }`}
                    >
                      {r.isActive ? 'Faol' : "O'chiq"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggle(r.id)}
                        disabled={busy === r.id}
                        className="h-9 px-3 rounded-lg bg-black/5 hover:bg-black/10 text-sm font-semibold disabled:opacity-60"
                      >
                        {r.isActive ? "O'chirib qo'yish" : 'Yoqish'}
                      </button>
                      <button
                        onClick={() => remove(r.id, r.joined)}
                        disabled={busy === r.id}
                        className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center disabled:opacity-60"
                        title="O'chirish"
                      >
                        <Icon name="delete" className="text-[18px]" />
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
