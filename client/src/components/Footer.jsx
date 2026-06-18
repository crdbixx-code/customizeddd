import { Link } from 'react-router-dom';
import { MessageCircle, Send, Mail } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="flex items-baseline font-display font-bold text-lg">
            <span className="text-ink-1">play</span>
            <span className="text-cyan">beat</span>
          </Link>
          <p className="text-sm text-ink-3 mt-3 leading-relaxed max-w-xs">
            Digital goods, instant delivery, local payment methods. {settings.siteName}.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-lg bg-panel border border-line-hi flex items-center justify-center text-ink-2 hover:text-teal hover:border-teal/40"
              >
                <MessageCircle size={15} />
              </a>
            )}
            {settings.telegram && (
              <a
                href={`https://t.me/${settings.telegram}`}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-lg bg-panel border border-line-hi flex items-center justify-center text-ink-2 hover:text-cyan hover:border-cyan/40"
              >
                <Send size={15} />
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="h-9 w-9 rounded-lg bg-panel border border-line-hi flex items-center justify-center text-ink-2 hover:text-amber hover:border-amber/40"
              >
                <Mail size={15} />
              </a>
            )}
          </div>
        </div>

        <FooterCol
          title="Shop"
          links={[
            ['Games', '/category/games'],
            ['Gift Cards', '/category/gift-cards'],
            ['Software', '/category/software'],
            ['AI Tools', '/category/ai-tools'],
            ['Subscriptions', '/category/subscriptions'],
            ['Top Up', '/category/top-up'],
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            ['My Orders', '/account/orders'],
            ['Wishlist', '/account/wishlist'],
            ['Login', '/login'],
            ['Create Account', '/register'],
          ]}
        />
        <div>
          <h4 className="font-display text-xs uppercase tracking-wider text-ink-3 mb-3">Support</h4>
          <p className="text-sm text-ink-2">{settings.email}</p>
          {settings.whatsapp && <p className="text-sm text-ink-2 mt-1 font-mono">+{settings.whatsapp}</p>}
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-4 font-mono">
        © {new Date().getFullYear()} {settings.siteName} · All payments processed securely
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-display text-xs uppercase tracking-wider text-ink-3 mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-ink-2 hover:text-cyan transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
