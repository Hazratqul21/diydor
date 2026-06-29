import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  payingUsers: number;
  newToday: number;
  totalMatches: number;
  openReports: number;
  revenueSom: number;
}

const CARDS: { key: keyof Stats; label: string; icon: string; color: string; money?: boolean }[] = [
  { key: 'totalUsers', label: 'Jami foydalanuvchi', icon: 'group', color: 'bg-blue-500' },
  { key: 'newToday', label: 'Bugun yangi', icon: 'person_add', color: 'bg-emerald-500' },
  { key: 'verifiedUsers', label: 'Tasdiqlangan', icon: 'verified', color: 'bg-teal-500' },
  { key: 'payingUsers', label: 'Obunachilar', icon: 'workspace_premium', color: 'bg-amber-500' },
  { key: 'totalMatches', label: 'Matchlar', icon: 'favorite', color: 'bg-rose-500' },
  { key: 'openReports', label: 'Shikoyatlar', icon: 'flag', color: 'bg-red-500' },
  { key: 'revenueSom', label: 'Daromad (so\'m)', icon: 'payments', color: 'bg-violet-500', money: true },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/admin/stats').then(setStats).catch(() => undefined);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Boshqaruv paneli</h1>
      <p className="text-black/50 mb-6">Diydor platformasi umumiy ko'rsatkichlari</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <div key={c.key} className="bg-white rounded-2xl border border-black/5 p-5">
            <div className={`w-10 h-10 rounded-xl ${c.color} text-white flex items-center justify-center mb-3`}>
              <Icon name={c.icon} fill className="text-[20px]" />
            </div>
            <div className="text-2xl font-extrabold">
              {stats ? (c.money ? stats[c.key].toLocaleString('ru-RU') : stats[c.key]) : '—'}
            </div>
            <div className="text-sm text-black/50">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
