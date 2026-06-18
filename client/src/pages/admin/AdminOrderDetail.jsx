import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import { formatPKR, formatDateTime } from '../../lib/format';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = ['pending_payment', 'processing', 'fulfilling', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = () => {
    adminApi.getOrder(id).then((data) => {
      setOrder(data.order);
      setStatusForm({ status: data.order.status, note: '' });
    });
  };

  useEffect(load, [id]);

  if (!order) return <p className="text-sm text-ink-3">Loading…</p>;

  const updateStatus = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      await adminApi.updateOrderStatus(id, statusForm.status, statusForm.note);
      toast.success('Status updated');
      setStatusForm((f) => ({ ...f, note: '' }));
      load();
    } catch {
      toast.error('Could not update status');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/admin/orders" className="text-xs text-cyan hover:underline">
            ← Back to orders
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-1 mt-1">{order.orderNumber}</h1>
          <p className="text-xs text-ink-3 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="bg-panel border border-line rounded-xl2 p-5">
            <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 py-3">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-surface" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-1">{item.name}</p>
                    <p className="text-xs text-ink-3 font-mono">
                      {item.productId} · Qty {item.qty}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-ink-1">
                    {formatPKR(item.subtotal, { fromPaisa: true })}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line mt-3 pt-3 space-y-1.5 text-sm font-mono">
              <Row label="Subtotal" value={formatPKR(order.subtotal, { fromPaisa: true })} />
              {order.discount > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`-${formatPKR(order.discount, { fromPaisa: true })}`} accent="teal" />
              )}
              <Row label="Total" value={formatPKR(order.total, { fromPaisa: true })} bold />
            </div>
          </section>

          {order.deliveryItems?.length > 0 && (
            <section className="bg-panel border border-line rounded-xl2 p-5">
              <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Delivered keys</h2>
              <ul className="space-y-2">
                {order.deliveryItems.map((d, idx) => (
                  <li key={idx} className="bg-surface border border-line-hi rounded-lg p-3 font-mono text-sm text-cyan break-all">
                    {d.key}
                    {d.notes && <p className="text-xs text-ink-3 mt-1 font-sans">{d.notes}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {order.statusHistory?.length > 0 && (
            <section className="bg-panel border border-line rounded-xl2 p-5">
              <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Timeline</h2>
              <ol className="space-y-3">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="h-2 w-2 rounded-full bg-cyan mt-1.5 shrink-0" />
                    <div>
                      <p className="text-ink-1">
                        <StatusBadge status={h.status} />{' '}
                        <span className="text-ink-3 ml-1">by {h.by}</span>
                        {h.note && <span className="text-ink-3"> — {h.note}</span>}
                      </p>
                      <p className="text-xs text-ink-4 font-mono mt-0.5">{formatDateTime(h.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="bg-panel border border-line rounded-xl2 p-5">
            <h2 className="font-display text-sm font-semibold text-ink-1 mb-3">Customer</h2>
            <p className="text-sm text-ink-1">{order.userName}</p>
            <p className="text-xs text-ink-3">{order.userEmail}</p>
            {order.user?.phone && <p className="text-xs text-ink-3">{order.user.phone}</p>}
          </section>

          <section className="bg-panel border border-line rounded-xl2 p-5">
            <h2 className="font-display text-sm font-semibold text-ink-1 mb-3">Update status</h2>
            <form onSubmit={updateStatus} className="space-y-3">
              <Select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Note (optional)"
                value={statusForm.note}
                onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
              />
              <Button type="submit" className="w-full" loading={savingStatus}>
                Update status
              </Button>
            </form>
          </section>

          <section className="bg-panel border border-line rounded-xl2 p-5 space-y-2.5">
            <h2 className="font-display text-sm font-semibold text-ink-1 mb-1">Fulfilment</h2>
            <Button variant="secondary" className="w-full" onClick={() => setDeliverModalOpen(true)}>
              Deliver keys
            </Button>
            <Button
              variant="danger"
              className="w-full"
              disabled={order.paymentStatus !== 'paid'}
              onClick={() => setRefundModalOpen(true)}
            >
              Refund order
            </Button>
          </section>
        </aside>
      </div>

      <DeliverModal
        open={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        order={order}
        onDone={load}
      />
      <RefundModal
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        order={order}
        onDone={load}
      />
    </div>
  );
}

function DeliverModal({ open, onClose, order, onDone }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRows(order.items.map((i) => ({ productId: i.productId, key: '', notes: '' })));
    }
  }, [open, order]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.deliverOrder(order._id, rows.filter((r) => r.key.trim()));
      toast.success('Keys delivered to customer');
      onClose();
      onDone();
    } catch {
      toast.error('Delivery failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Deliver keys">
      <form onSubmit={submit} className="space-y-4">
        {rows.map((r, idx) => (
          <div key={r.productId} className="space-y-2">
            <p className="text-xs text-ink-3">{order.items[idx]?.name}</p>
            <Input
              placeholder="License key / account details"
              value={r.key}
              onChange={(e) => {
                const next = [...rows];
                next[idx].key = e.target.value;
                setRows(next);
              }}
            />
            <Input
              placeholder="Notes (optional)"
              value={r.notes}
              onChange={(e) => {
                const next = [...rows];
                next[idx].notes = e.target.value;
                setRows(next);
              }}
            />
          </div>
        ))}
        <Button type="submit" className="w-full" loading={saving}>
          Mark delivered & send
        </Button>
      </form>
    </Modal>
  );
}

function RefundModal({ open, onClose, order, onDone }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const fullAmount = order.total / 100;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.refundOrder(order._id, amount ? parseFloat(amount) : undefined, reason);
      toast.success('Refund processed');
      onClose();
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Refund failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Refund order">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-3">
          Order total: <span className="font-mono text-ink-1">{formatPKR(order.total, { fromPaisa: true })}</span>
        </p>
        <Input
          label={`Refund amount (PKR) — leave blank for full refund of Rs ${fullAmount}`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button type="submit" variant="danger" className="w-full" loading={saving}>
          Process refund
        </Button>
      </form>
    </Modal>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className={bold ? 'font-semibold text-base text-cyan' : accent === 'teal' ? 'text-teal' : 'text-ink-1'}>
        {value}
      </span>
    </div>
  );
}
