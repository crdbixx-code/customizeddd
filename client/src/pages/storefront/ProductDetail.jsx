import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, Zap, ShieldCheck, Minus, Plus, ShoppingCart } from 'lucide-react';
import { productsApi } from '../../api/products';
import { authApi } from '../../api/auth';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPKR } from '../../lib/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { BADGE_LABELS } from '../../lib/categories';
import ProductCard from '../../components/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { user, updateUser } = useAuth();
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(id)
      .then((p) => {
        setProduct(p);
        setQty(1);
        return productsApi.list({ category: p.category, limit: 5 });
      })
      .then((data) => setRelated(data?.products?.filter((p) => p.id !== id).slice(0, 4) || []))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-ink-3">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-ink-2 mb-4">Product not found.</p>
        <Link to="/" className="text-cyan hover:underline">
          Back to store
        </Link>
      </div>
    );
  }

  const badge = BADGE_LABELS[product.badge];
  const inWishlist = user?.wishlist?.includes(product.id);
  const outOfStock = product.stock <= 0;

  const handleWishlist = async () => {
    if (!user) return toast.error('Log in to save to wishlist');
    setWishBusy(true);
    try {
      const { wishlist } = await authApi.toggleWishlist(product.id);
      updateUser({ ...user, wishlist });
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative aspect-[10/7] rounded-xl2 overflow-hidden bg-surface border border-line">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
            {product.discount > 0 && <Badge tone="coral">-{product.discount}%</Badge>}
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-cyan mb-2">
            {product.category} {product.subcategory ? `· ${product.subcategory}` : ''}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-1">{product.name}</h1>

          <div className="flex items-center gap-3 mt-3 text-sm text-ink-2">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber fill-amber" /> {product.rating}
            </span>
            <span>·</span>
            <span>{product.reviews?.toLocaleString()} reviews</span>
            <span>·</span>
            <span>{product.sales?.toLocaleString()} sold</span>
          </div>

          <p className="text-ink-2 leading-relaxed mt-5">{product.description}</p>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-mono px-2 py-1 rounded-md bg-white/5 text-ink-3 border border-line"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3 mt-7 font-mono">
            <span className="text-3xl font-bold text-ink-1">{formatPKR(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-base text-ink-4 line-through">{formatPKR(product.originalPrice)}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <Zap size={13} className="text-teal" /> {product.deliveryTime} delivery
            </span>
            <span>·</span>
            <span className={product.stock > 10 ? 'text-teal' : product.stock > 0 ? 'text-amber' : 'text-coral'}>
              {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
            {product.platform && (
              <>
                <span>·</span>
                <span>{product.platform}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mt-7">
            <div className="flex items-center border border-line-hi rounded-lg">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-11 flex items-center justify-center text-ink-2 hover:text-cyan"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-mono text-ink-1">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="h-11 w-11 flex items-center justify-center text-ink-2 hover:text-cyan"
              >
                <Plus size={14} />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => addItem(product, qty)}
            >
              <ShoppingCart size={16} /> Add to cart
            </Button>
            <Button
              size="lg"
              variant={inWishlist ? 'danger' : 'secondary'}
              onClick={handleWishlist}
              loading={wishBusy}
            >
              <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-5 text-xs text-ink-3">
            <ShieldCheck size={14} className="text-teal" />
            Secure checkout · Stripe, JazzCash, EasyPaisa, Bank Alfalah & more
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold text-ink-1 mb-5">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
