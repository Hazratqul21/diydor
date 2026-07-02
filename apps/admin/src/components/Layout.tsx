import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/api';
import { Icon } from './Icon';

const NAV = [
  { to: '/', label: 'Boshqaruv', icon: 'dashboard', end: true },
  { to: '/users', label: 'Foydalanuvchilar', icon: 'group' },
  { to: '/orders', label: "To'lovlar", icon: 'receipt_long' },
  { to: '/withdrawals', label: 'Pul yechish', icon: 'account_balance_wallet' },
  { to: '/chats', label: 'Suhbatlar', icon: 'forum' },
  { to: '/reports', label: 'Shikoyatlar', icon: 'flag' },
  { to: '/plans', label: 'Tariflar', icon: 'workspace_premium' },
  { to: '/referrals', label: 'Referal linklar', icon: 'share' },
  { to: '/settings', label: 'Sozlamalar', icon: 'settings' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();

  function logout() {
    clearToken();
    nav('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-black/5 flex flex-col fixed h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-black/5">
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
            <Icon name="favorite" fill className="text-[18px]" />
          </div>
          <span className="font-extrabold text-lg">Diydor</span>
          <span className="text-xs text-black/40 font-semibold">admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-brand text-white' : 'text-black/60 hover:bg-black/5'
                }`
              }
            >
              <Icon name={n.icon} className="text-[20px]" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <Icon name="logout" className="text-[20px]" />
          Chiqish
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 p-8 max-w-[1100px]">{children}</main>
    </div>
  );
}
