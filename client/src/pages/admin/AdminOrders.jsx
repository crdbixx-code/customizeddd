import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatPKR, formatDate } from '../../lib/format';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/ui/Select';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (payment) params.payment = payment;
    adminApi
      .listOrders(params)
      .then((data) => {
        setOrders(data.orders);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [status, payment]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1">Orders</h1>
        <p className="text-sm text-ink-3 mt-1">{total} total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="processing">Processing</option>
          <option value="fulfilling">Fulfilling</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-auto">
          <option value="">All payment statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partial_refund">Partial refund</option>
        </Select>
      </div>

      <div className="bg-panel border border-line rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-cyan">
                    <Link to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink-1">
                    {o.userName}
                    <div className="text-xs text-ink-3">{o.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-xs">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-1">
                    {formatPKR(o.total, { fromPaisa: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
