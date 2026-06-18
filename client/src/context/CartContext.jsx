import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const STORAGE_KEY = 'pb_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const maxQty = product.stock ?? 99;
        const nextQty = Math.min(existing.qty + qty, maxQty);
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: nextQty } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          platform: product.platform,
          stock: product.stock,
          qty,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
    setIsOpen(true);
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const setQty = (productId, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock ?? 99)) } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        setQty,
        clearCart,
        subtotal,
        totalQty,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
