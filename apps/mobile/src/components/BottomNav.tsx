import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const ITEMS = [
  { to: '/discover', icon: 'style', label: 'Kashfiyot' },
  { to: '/likes', icon: 'favorite', label: 'Yoqtirishlar' },
  { to: '/messages', icon: 'chat_bubble', label: 'Xabarlar' },
  { to: '/profile', icon: 'person', label: 'Profil' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto z-50 flex justify-around items-center px-4 pb-safe-bottom h-[64px] bg-surface/80 backdrop-blur-xl border-t border-surface-variant/30">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 press transition-colors ${
              isActive ? 'text-primary' : 'text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={it.icon} fill={isActive} className="text-[24px] mb-1" />
              <span className="text-[10px] font-label-sm leading-tight">{it.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
