import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const NAV_LINKS = [
  { to: '/category/games', label: 'Games' },
  { to: '/category/gift-cards', label: 'Gift Cards' },
  { to: '/category/software', label: 'Software' },
  { to: '/category/ai-tools', label: 'AI Tools' },
  { to: '/category/subscriptions', label: 'Subscriptions' },
  { to: '/category/top-up', label: 'Top Up' },
];

export default function Navbar() {
  const { totalQty, setIsOpen } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50">
      {settings.announcementBar && (
        <div className="bg-cyan/10 border-b border-cyan/20 text-center text-[11px] sm:text-xs text-cyan font-mono py-1.5 px-4 truncate">
          {settings.announcementBar}
        </div>
      )}
      <div className="glass border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-baseline gap-0 font-display font-bold text-lg shrink-0">
            <span className="text-ink-1">play</span>
            <span className="text-cyan">beat</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-cyan bg-cyan/10' : 'text-ink-2 hover:text-ink-1 hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-sm ml-auto relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-surface border border-line-hi rounded-lg pl-9 pr-3 py-2 text-sm text-ink-1 placeholder:text-ink-4 outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/15"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto md:ml-2 shrink-0">
            <Link
              to={user ? '/account' : '/login'}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-2 hover:text-cyan hover:bg-white/5 transition-colors"
              aria-label="Account"
            >
              <User size={18} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="relative h-9 w-9 rounded-lg flex items-center justify-center text-ink-2 hover:text-cyan hover:bg-white/5 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {totalQty > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 min-w-[18px] px-1 rounded-full bg-cyan text-base text-[10px] font-mono font-bold flex items-center justify-center">
                  {totalQty}
                </span>
              )}
            </button>
            <button
              className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-ink-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-line px-4 py-3 flex flex-col gap-1 bg-surface">
            <form onSubmit={submitSearch} className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-base border border-line-hi rounded-lg pl-9 pr-3 py-2 text-sm text-ink-1 outline-none"
              />
            </form>
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-white/5"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
