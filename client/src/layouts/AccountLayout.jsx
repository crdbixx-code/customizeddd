import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LINKS = [
  { to: '/account', label: 'Overview', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside>
        <div className="bg-panel border border-line rounded-xl2 p-4 mb-4">
          <p className="text-sm font-medium text-ink-1 truncate">{user?.name}</p>
          <p className="text-xs text-ink-3 truncate">{user?.email}</p>
          {!user?.emailVerified && (
            <span className="inline-block mt-2 text-[10px] font-mono uppercase tracking-wider text-amber bg-amber/10 border border-amber/25 px-2 py-0.5 rounded">
              Email unverified
            </span>
          )}
        </div>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-cyan/10 text-cyan' : 'text-ink-2 hover:bg-white/5 hover:text-ink-1'
                }`
              }
            >
              <l.icon size={15} /> {l.label}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-coral hover:bg-coral/10 mt-2"
          >
            <LogOut size={15} /> Log out
          </button>
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
