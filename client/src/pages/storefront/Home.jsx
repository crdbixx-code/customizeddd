import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Headphones } from 'lucide-react';
import { productsApi } from '../../api/products';
import { useSettings } from '../../context/SettingsContext';
import ProductCard from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { getCategoryIcon } from '../../lib/categories';
import Button from '../../components/ui/Button';

export default function Home() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.categories(),
      productsApi.list({ featured: 'true', limit: 8 }),
      productsApi.list({ trending: 'true', limit: 4 }),
      productsApi.stats(),
    ])
      .then(([cats, feat, trend, st]) => {
        setCategories(cats);
        setFeatured(feat.products);
        setTrending(trend.products);
        setStats(st);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-dotgrid border-b border-line">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 70% -10%, rgba(45,212,255,.08), transparent 65%)',
            maskImage: 'radial-gradient(ellipse 90% 90% at 50% 30%, black 40%, transparent 85%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            {settings.heroBadge && (
              <span className="live-dot inline-flex items-center font-mono text-[11px] uppercase tracking-widest text-cyan border border-cyan/30 bg-cyan/5 px-3 py-1.5 rounded-full mb-5">
                {settings.heroBadge}
              </span>
            )}
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] text-ink-1">
              {settings.heroHeadline}
            </h1>
            <p className="text-ink-2 mt-5 text-base leading-relaxed">{settings.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link to="/category/games">
                <Button size="lg">
                  Browse store <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/category/top-up">
                <Button size="lg" variant="secondary">
                  Top up balance
                </Button>
              </Link>
            </div>
          </div>

          {stats && (
            <div className="flex gap-3 sm:gap-4 shrink-0">
              <StatCard value={stats.totalProducts} label="Products" />
              <StatCard value={stats.happyCustomers?.toLocaleString()} label="Customers" />
              <StatCard value={stats.totalCategories} label="Categories" />
            </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap gap-6 justify-center sm:justify-between text-sm text-ink-2">
          <TrustItem icon={Zap} text="Instant digital delivery" />
          <TrustItem icon={ShieldCheck} text="Secure local & international payments" />
          <TrustItem icon={Headphones} text="24/7 customer support" />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-3 mb-4">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.id);
            return (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className="group bg-panel border border-line rounded-xl2 p-4 flex flex-col items-center gap-2 hover:border-cyan/30 transition-colors text-center"
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${c.color}1a`, color: c.color }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-ink-1">{c.name}</span>
                <span className="text-[10px] font-mono text-ink-4">{c.count} items</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <Section title="Trending now" to="/category/all?sort=sales">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((p) => <ProductCard key={p.id} product={p} />)}
        </Section>
      )}

      {/* Featured */}
      <Section title="Featured products" to="/category/all?featured=true">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </Section>
    </div>
  );
}

function Section({ title, to, children }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-ink-1">{title}</h2>
        <Link to={to} className="text-sm text-cyan hover:underline flex items-center gap-1">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="glass border border-line-hi rounded-xl2 px-5 py-3.5 text-center min-w-[100px]">
      <div className="font-mono text-xl font-bold text-cyan">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-4 mt-0.5">{label}</div>
    </div>
  );
}

function TrustItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-teal" />
      <span>{text}</span>
    </div>
  );
}
