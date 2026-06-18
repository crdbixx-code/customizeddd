import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatPKR, formatDateTime } from '../../lib/format';
import StatusBadge from '../../components/StatusBadge';

export default function AccountOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    ordersApi
      .get(id)
      .then((data) => setOrder(data.order))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-2 mb-3">Order not found.</p>
        <Link to="/account/orders" className="text-cyan hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return <p className="text-sm text-ink-3">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-1">Order {order.orderNumber}</h1>
          <p className="text-xs text-ink-3 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="bg-panel border border-line rounded-xl2 p-5">
        <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Items</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 py-3">
              <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-surface" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-1">{item.name}</p>
                <p className="text-xs text-ink-3 font-mono">Qty {item.qty}</p>
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
            <Row label="Discount" value={`-${formatPKR(order.discount, { fromPaisa: true })}`} accent="teal" />
          )}
          <Row label="Total" value={formatPKR(order.total, { fromPaisa: true })} bold />
        </div>
      </section>

      <section className="bg-panel border border-line rounded-xl2 p-5">
        <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Payment</h2>
        <div className="space-y-1.5 text-sm">
          <Row label="Method" value={order.paymentMethod} />
          <Row label="Status" value={<StatusBadge status={order.paymentStatus} />} />
          {order.paymentRef && <Row label="Reference" value={order.paymentRef} mono />}
        </div>
      </section>

      {order.deliveryItems?.length > 0 && (
        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Your delivery</h2>
          <ul className="space-y-3">
            {order.deliveryItems.map((d, idx) => (
              <DeliveryRow key={idx} item={d} />
            ))}
          </ul>
        </section>
      )}

      {order.statusHistory?.length > 0 && (
        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Order timeline</h2>
          <ol className="space-y-3">
            {order.statusHistory.map((h, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="h-2 w-2 rounded-full bg-cyan mt-1.5 shrink-0" />
                <div>
                  <p className="text-ink-1">
                    <StatusBadge status={h.status} /> {h.note && <span className="text-ink-3 ml-2">{h.note}</span>}
                  </p>
                  <p className="text-xs text-ink-4 font-mono mt-0.5">{formatDateTime(h.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function DeliveryRow({ item }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(item.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <li className="bg-surface border border-line-hi rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm text-cyan break-all">{item.key}</span>
        <button onClick={copy} className="text-ink-3 hover:text-cyan shrink-0">
          {copied ? <Check size={15} className="text-teal" /> : <Copy size={15} />}
        </button>
      </div>
      {item.notes && <p className="text-xs text-ink-3 mt-1.5">{item.notes}</p>}
    </li>
  );
}

function Row({ label, value, bold, accent, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span
        className={`${mono ? 'font-mono' : ''} ${bold ? 'font-semibold text-base text-cyan' : accent === 'teal' ? 'text-teal' : 'text-ink-1'}`}
      >
        {value}
      </span>
    </div>
  );
}
