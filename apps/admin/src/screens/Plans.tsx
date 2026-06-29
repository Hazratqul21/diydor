import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface Plan {
  id: string;
  tier: 'PLUS' | 'GOLD' | 'PLATINUM' | 'FREE';
  period: 'WEEK' | 'MONTH' | 'YEAR';
  priceSom: number;
  discountPercent: number;
  active: boolean;
  sortOrder: number;
}

const PERIOD_LABEL: Record<string, string> = { WEEK: 'Hafta', MONTH: 'Oy', YEAR: 'Yil' };

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [savingId, setSavingId] = useState('');

  function load() {
    api<Plan[]>('/admin/plans').then(setPlans).catch(() => setPlans([]));
  }
  useEffect(load, []);

  function patch(id: string, field: keyof Plan, value: number | boolean) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function save(p: Plan) {
    setSavingId(p.id);
    try {
      await api('/admin/plans', {
        method: 'PUT',
        body: JSON.stringify({
          tier: p.tier,
          period: p.period,
          priceSom: p.priceSom,
          discountPercent: p.discountPercent,
          active: p.active,
          sortOrder: p.sortOrder,
        }),
      });
      load();
    } finally {
      setSavingId('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Tariflar</h1>
      <p className="text-black/50 mb-6">Obuna narxlari va chegirmalarini boshqarish</p>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-black/50 text-left">
            <tr>
              <th className="p-3 font-semibold">Tarif</th>
              <th className="p-3 font-semibold">Davr</th>
              <th className="p-3 font-semibold">Narx (so'm)</th>
              <th className="p-3 font-semibold">Chegirma %</th>
              <th className="p-3 font-semibold">Faol</th>
              <th className="p-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-black/5">
                <td className="p-3 font-bold">{p.tier}</td>
                <td className="p-3 text-black/60">{PERIOD_LABEL[p.period]}</td>
                <td className="p-3">
                  <input
                    type="number"
                    value={p.priceSom}
                    onChange={(e) => patch(p.id, 'priceSom', Number(e.target.value))}
                    className="w-28 h-9 px-2 rounded-lg bg-black/5 outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={p.discountPercent}
                    onChange={(e) => patch(p.id, 'discountPercent', Number(e.target.value))}
                    className="w-20 h-9 px-2 rounded-lg bg-black/5 outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => patch(p.id, 'active', !p.active)}
                    className={`w-11 h-6 rounded-full relative transition-colors ${p.active ? 'bg-emerald-500' : 'bg-black/20'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${p.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => save(p)}
                    disabled={savingId === p.id}
                    className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    {savingId === p.id ? <Icon name="progress_activity" className="animate-spin text-[16px]" /> : 'Saqlash'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
