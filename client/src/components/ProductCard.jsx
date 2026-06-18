import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Zap } from 'lucide-react';
import { formatPKR } from '../lib/format';
import { BADGE_LABELS } from '../lib/categories';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Badge from './ui/Badge';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { user, updateUser } = useAuth();
  const [wishBusy, setWishBusy] = useState(false);
  const badge = BADGE_LABELS[product.badge];
  const inWishlist = user?.wishlist?.includes(product.id);
  const outOfStock = product.stock <= 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
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
    <div className="group relative bg-panel border border-line rounded-xl2 overflow-hidden hover:border-cyan/30 transition-colors duration-200 flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block aspect-[10/7] overflow-hidden bg-surface">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
          {product.discount > 0 && <Badge tone="coral">-{product.discount}%</Badge>}
        </div>
        <button
          onClick={handleWishlist}
          disabled={wishBusy}
          aria-label="Toggle wishlist"
          className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
            inWishlist ? 'bg-coral/20 text-coral' : 'bg-black/30 text-white/80 hover:text-coral'
          }`}
        >
          <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-2">Out of stock</span>
          </div>
        )}
      </Link>

      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-[11px] text-ink-3 font-mono">
          <Zap size={11} className="text-teal" />
          {product.deliveryTime || 'Instant'} delivery
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-ink-1 leading-snug line-clamp-2 hover:text-cyan transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-ink-3">
          <Star size={12} className="text-amber fill-amber" />
          <span className="text-ink-2">{product.rating}</span>
          <span>·</span>
          <span>{product.reviews?.toLocaleString()} reviews</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="font-mono leading-none">
            <div className="text-base font-semibold text-ink-1">{formatPKR(product.price)}</div>
            {product.originalPrice > product.price && (
              <div className="text-[11px] text-ink-4 line-through">{formatPKR(product.originalPrice)}</div>
            )}
          </div>
          <button
            onClick={() => addItem(product, 1)}
            disabled={outOfStock}
            aria-label="Add to cart"
            className="h-9 w-9 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan hover:text-base transition-colors flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
