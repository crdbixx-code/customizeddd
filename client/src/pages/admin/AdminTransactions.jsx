import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { formatPKR, formatDateTime } from '../../lib/format';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/ui/Select';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listTransactions(gateway ? { gateway } : {})
      .then((data) => {
        setTransactions(data.transactions);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [gateway]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1">Transactions</h1>
        <p className="text-sm text-ink-3 mt-1">{total} total · payment audit log</p>
      </div>

      <Select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-auto">
        <option value="">All gateways</option>
        <option value="stripe">Stripe</option>
        <option value="jazzcash">JazzCash</option>
        <option value="easypaisa">EasyPaisa</option>
        <option value="alfalah">Bank Alfalah</option>
        <option value="meezan">Meezan</option>
        <option value="bank_transfer">Bank Transfer</option>
      </Select>

      <div className="bg-panel border border-line rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-3">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-cyan">{t.orderNumber}</td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-xs">{t.gateway}</td>
                  <td className="px-4 py-3 text-ink-2 text-xs">{t.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-3 font-mono text-xs truncate max-w-[160px]">
                    {t.gatewayRef}
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs">{formatDateTime(t.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-1">
                    {formatPKR(t.amount, { fromPaisa: true })}
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
