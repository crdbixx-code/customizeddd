import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPKR } from '../lib/format';
import Button from './ui/Button';
import { EmptyState } from './ui/Skeleton';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, setQty, subtotal } = useCart();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full sm:w-[420px] h-full bg-panel border-l border-line-hi flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-ink-1">
            Your Cart {items.length > 0 && <span className="text-ink-3 text-sm">({items.length})</span>}
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-ink-3 hover:text-ink-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              subtitle="Browse the store and add a few digital goodies."
              action={
                <Button onClick={() => setIsOpen(false)} size="sm">
                  Continue shopping
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg object-cover bg-surface shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-1 line-clamp-2">{item.name}</p>
                    <p className="font-mono text-sm text-cyan mt-1">{formatPKR(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-line-hi rounded-md">
                        <button
                          onClick={() => setQty(item.productId, item.qty - 1)}
                          className="h-7 w-7 flex items-center justify-center text-ink-2 hover:text-cyan"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-xs font-mono text-ink-1">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.productId, item.qty + 1)}
                          className="h-7 w-7 flex items-center justify-center text-ink-2 hover:text-cyan"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-ink-4 hover:text-coral transition-colors ml-1"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-2">Subtotal</span>
              <span className="font-mono font-semibold text-ink-1 text-base">{formatPKR(subtotal)}</span>
            </div>
            <Link to="/checkout" onClick={() => setIsOpen(false)}>
              <Button className="w-full" size="lg">
                Checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
