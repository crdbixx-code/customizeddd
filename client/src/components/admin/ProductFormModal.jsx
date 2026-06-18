import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const EMPTY = {
  name: '',
  category: '',
  subcategory: '',
  price: '',
  originalPrice: '',
  stock: '',
  description: '',
  image: '',
  badge: '',
  featured: false,
  trending: false,
  tags: '',
  deliveryTime: 'Instant',
  platform: '',
};

export default function ProductFormModal({ open, onClose, onSubmit, categories, initial }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        ...EMPTY,
        ...initial,
        tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : initial.tags || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial, open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit product' : 'New product'} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Select
          label="Category"
          required
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          label="Subcategory"
          value={form.subcategory}
          onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
        />
        <Input
          label="Platform"
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
        />
        <Input
          label="Price (PKR)"
          type="number"
          required
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <Input
          label="Original price (PKR)"
          type="number"
          value={form.originalPrice}
          onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
        />
        <Input
          label="Stock"
          type="number"
          required
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <Select
          label="Badge"
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
        >
          <option value="">None</option>
          <option value="bestseller">Bestseller</option>
          <option value="new">New</option>
          <option value="hot">Hot</option>
          <option value="sale">Sale</option>
          <option value="limited">Limited</option>
        </Select>
        <Input
          label="Delivery time"
          value={form.deliveryTime}
          onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
        />
        <Input
          label="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-2">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 outline-none focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15"
          />
        </div>
        <Input
          label="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="sm:col-span-2"
        />
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-cyan"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={form.trending}
              onChange={(e) => setForm({ ...form, trending: e.target.checked })}
              className="accent-cyan"
            />
            Trending
          </label>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {initial ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
