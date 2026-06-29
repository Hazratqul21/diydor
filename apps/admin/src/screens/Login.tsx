import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { Icon } from '../components/Icon';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      nav('/');
    } catch (err) {
      setError((err as Error).message || 'Kirish xatosi');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-black/5 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center mb-3">
            <Icon name="favorite" fill className="text-[24px]" />
          </div>
          <h1 className="text-xl font-extrabold">Diydor Admin</h1>
          <p className="text-sm text-black/50">Boshqaruv paneliga kirish</p>
        </div>

        <label className="block text-xs font-semibold text-black/50 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40 mb-4"
          placeholder="admin@diydor.uz"
        />

        <label className="block text-xs font-semibold text-black/50 mb-1">Parol</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full h-11 px-3 rounded-xl bg-black/5 outline-none focus:ring-2 focus:ring-brand/40 mb-4"
          placeholder="••••••••"
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-xl bg-brand text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? <Icon name="progress_activity" className="animate-spin" /> : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
