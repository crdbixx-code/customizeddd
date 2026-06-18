import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import { EmptyState, ProductCardSkeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

export default function AccountWishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    const ids = user?.wishlist || [];
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    productsApi.list({}).then((data) => {
      setProducts(data.products.filter((p) => ids.includes(p.id)));
    });
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-1 mb-6">Wishlist</h1>

      {products === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          subtitle="Tap the heart icon on any product to save it here."
          action={
            <Link to="/">
              <Button size="sm">Browse store</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
