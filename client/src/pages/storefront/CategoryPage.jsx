import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../../components/ui/Skeleton';
import { PackageSearch } from 'lucide-react';
import Select from '../../components/ui/Select';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get('sort') || 'trending');

  const isAllOrSearch = !categoryId || categoryId === 'all';
  const title = q ? `Search: "${q}"` : isAllOrSearch ? 'All products' : categoryId;

  const load = useCallback(() => {
    setLoading(true);
    const params = { sort };
    if (categoryId && categoryId !== 'all') params.category = categoryId;
    if (q) params.search = q;
    if (searchParams.get('featured')) params.featured = searchParams.get('featured');

    productsApi
      .list(params)
      .then((data) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, [categoryId, q, sort, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    productsApi.categories().then(setCategories);
  }, []);

  const currentCat = categories.find((c) => c.id === categoryId);

  return (
    <div>
      <div className="border-b border-line bg-surface py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-1 capitalize">
            {currentCat ? currentCat.name : title}
          </h1>
          <p className="text-sm text-ink-3 mt-1 font-mono">
            {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-30 bg-base/95 backdrop-blur border-b border-line py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3">
          <SlidersHorizontal size={14} className="text-ink-3" />
          <Select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setSearchParams((p) => {
                p.set('sort', e.target.value);
                return p;
              });
            }}
            className="!py-1.5 !text-xs w-auto"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="sales">Bestselling</option>
          </Select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products found"
            subtitle="Try a different category or search term."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
