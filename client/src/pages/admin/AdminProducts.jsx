import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import { productsApi } from '../../api/products';
import { formatPKR } from '../../lib/format';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import ProductFormModal from '../../components/admin/ProductFormModal';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      productsApi.list(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
      productsApi.categories(),
    ])
      .then(([prods, cats]) => {
        setProducts(prods.products);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (form) => {
    try {
      await adminApi.createProduct(form);
      toast.success('Product created');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not create product');
      throw err;
    }
  };

  const handleUpdate = async (form) => {
    try {
      await adminApi.updateProduct(editing.id, form);
      toast.success('Product updated');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not update product');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Could not delete product');
    }
  };

  const bulkAction = async (action, value) => {
    if (selected.length === 0) return;
    try {
      await adminApi.bulkProducts(selected, action, value);
      toast.success('Bulk update applied');
      setSelected([]);
      load();
    } catch {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-1">Products</h1>
          <p className="text-sm text-ink-3 mt-1">{products.length} total</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={15} /> New product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-surface border border-line-hi rounded-lg pl-9 pr-3 py-2 text-sm text-ink-1 outline-none focus:border-cyan/50"
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-ink-3">{selected.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => bulkAction('feature', true)}>
              <Star size={13} /> Feature
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkAction('trending', true)}>
              <TrendingUp size={13} /> Trend
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${selected.length} products?`)) bulkAction('delete');
              }}
            >
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-panel border border-line rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  className="accent-cyan"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={(e) =>
                    setSelected(e.target.checked ? filtered.map((p) => p.id) : [])
                  }
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Sales</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="accent-cyan"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-9 w-9 rounded-md object-cover bg-surface" />
                      <div className="min-w-0">
                        <p className="text-ink-1 truncate max-w-[220px]">{p.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {p.featured && (
                            <span className="text-[10px] font-mono text-amber">★ featured</span>
                          )}
                          {p.trending && (
                            <span className="text-[10px] font-mono text-cyan ml-1">↗ trending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-2 text-xs font-mono">{p.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-1">{formatPKR(p.price)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={p.stock === 0 ? 'text-coral' : p.stock < 20 ? 'text-amber' : 'text-ink-1'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-3">{p.sales}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-cyan hover:bg-cyan/10"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-coral hover:bg-coral/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
        categories={categories}
        initial={editing}
      />
    </div>
  );
}
