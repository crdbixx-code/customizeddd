import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import { productsApi } from '../../api/products';
import { getCategoryIcon } from '../../lib/categories';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', icon: '📦', color: '#2dd4ff' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    productsApi.categories().then(setCategories).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCategory(form);
      toast.success('Category created');
      setModalOpen(false);
      setForm({ id: '', name: '', icon: '📦', color: '#2dd4ff' });
      load();
    } catch {
      toast.error('Could not create category');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category? Products in it will keep their category id.')) return;
    try {
      await adminApi.deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch {
      toast.error('Could not delete category');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-1">Categories</h1>
          <p className="text-sm text-ink-3 mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> New category
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : (
          categories.map((c) => {
            const Icon = getCategoryIcon(c.id);
            return (
              <div
                key={c.id}
                className="bg-panel border border-line rounded-xl2 p-4 flex items-center gap-3.5"
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${c.color}1a`, color: c.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-1 truncate">{c.name}</p>
                  <p className="text-xs text-ink-3 font-mono">{c.count} products · {c.id}</p>
                </div>
                <button
                  onClick={() => remove(c.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-coral hover:bg-coral/10 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New category">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="ID (slug)"
            required
            placeholder="e.g. game-items"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Icon (emoji)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <Input
            label="Color (hex)"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <Button type="submit" loading={saving}>
            Create category
          </Button>
        </form>
      </Modal>
    </div>
  );
}
