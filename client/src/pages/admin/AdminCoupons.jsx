import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../lib/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const EMPTY = { code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.listCoupons().then((data) => setCoupons(data.coupons)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCoupon(form);
      toast.success('Coupon created');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await adminApi.updateCoupon(c._id, { active: !c.active });
      load();
    } catch {
      toast.error('Could not update coupon');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success('Coupon deleted');
      load();
    } catch {
      toast.error('Could not delete coupon');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-1">Coupons</h1>
          <p className="text-sm text-ink-3 mt-1">{coupons.length} total</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> New coupon
        </Button>
      </div>

      <div className="bg-panel border border-line rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
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
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  No coupons yet
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-cyan">{c.code}</td>
                  <td className="px-4 py-3 text-ink-1">
                    {c.type === 'percent' ? `${c.value}%` : `Rs ${c.value}`}
                  </td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-xs">
                    {c.minOrder ? `Rs ${c.minOrder}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-xs">
                    {c.usedCount} / {c.maxUses || '∞'}
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs">
                    {c.expiresAt ? formatDate(c.expiresAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={c.active ? 'teal' : 'neutral'}>{c.active ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => toggleActive(c)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-cyan hover:bg-cyan/10"
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => remove(c._id)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New coupon">
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Code"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="sm:col-span-2"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount (PKR)</option>
          </Select>
          <Input
            label="Value"
            type="number"
            required
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <Input
            label="Min order (PKR)"
            type="number"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
          />
          <Input
            label="Max uses (0 = unlimited)"
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <Input
            label="Expires at"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="sm:col-span-2"
          />
          <Button type="submit" loading={saving} className="sm:col-span-2">
            Create coupon
          </Button>
        </form>
      </Modal>
    </div>
  );
}
