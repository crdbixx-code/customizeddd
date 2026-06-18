import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatPKR, formatDate } from '../../lib/format';
import { EmptyState } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';

export default function AccountOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    ordersApi.list().then((data) => setOrders(data.orders));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-1 mb-6">My orders</h1>

      {orders === null ? (
        <p className="text-sm text-ink-3">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          subtitle="Once you place an order, it'll show up here."
          action={
            <Link to="/">
              <Button size="sm">Browse store</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-panel border border-line rounded-xl2 divide-y divide-line">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/account/orders/${o._id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <p className="font-mono text-sm text-ink-1">{o.orderNumber}</p>
                <p className="text-xs text-ink-3 mt-0.5">{formatDate(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} />
                <span className="font-mono text-sm text-ink-1 w-24 text-right">
                  {formatPKR(o.total, { fromPaisa: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
