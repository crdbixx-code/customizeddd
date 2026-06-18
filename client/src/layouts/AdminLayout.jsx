import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  CreditCard,
  Ticket,
  Users,
  Receipt,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../api/admin';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/payments', label: 'Payment gateways', icon: CreditCard },
  { to: '/admin/settings', label: 'Site settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('pb_admin');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-base text-ink-1 flex">
      <aside className="w-60 shrink-0 border-r border-line bg-surface flex flex-col h-screen sticky top-0">
        <div className="px-5 h-16 flex items-center border-b border-line">
          <span className="font-display font-bold text-lg">
            <span className="text-ink-1">play</span>
            <span className="text-cyan">beat</span>
          </span>
          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-ink-4 border border-line-hi px-1.5 py-0.5 rounded">
            admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5">
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
              <l.icon size={16} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-line flex flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink-2 hover:bg-white/5 hover:text-ink-1"
          >
            <ExternalLink size={15} /> View store
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-coral hover:bg-coral/10"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-6 sm:p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
