import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../../api/admin';
import { formatPKR, formatDate } from '../../lib/format';
import StatCard from '../../components/admin/StatCard';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then(setData);
  }, []);

  if (!data) return <p className="text-sm text-ink-3">Loading dashboard…</p>;

  const chartData = data.byCategory.map((c) => ({
    name: c.category,
    revenue: Math.round(c.revenue / 100),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1">Dashboard</h1>
        <p className="text-sm text-ink-3 mt-1">Live overview of your store</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={DollarSign} label="Total revenue" value={formatPKR(data.totalRevenue)} tone="teal" />
        <StatCard icon={ShoppingBag} label="Total orders" value={data.totalOrders} sub={`${data.paidOrders} paid`} />
        <StatCard icon={Package} label="Products" value={data.totalProducts} sub={`${data.totalSales} sold`} />
        <StatCard icon={AlertTriangle} label="Low stock" value={data.lowStock} tone="amber" sub={`${data.outOfStock} out of stock`} />
        <StatCard icon={Star} label="Featured / Trending" value={`${data.featuredCount} / ${data.trendingCount}`} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-cyan" /> Revenue by category
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,170,220,0.08)" />
                <XAxis dataKey="name" stroke="#516a87" fontSize={11} />
                <YAxis stroke="#516a87" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#101e34', border: '1px solid rgba(120,170,220,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#eaf3ff' }}
                  formatter={(v) => formatPKR(v)}
                />
                <Bar dataKey="revenue" fill="#2dd4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Top products</h2>
          <ul className="divide-y divide-line">
            {data.topProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink-1 truncate max-w-[60%]">{p.name}</span>
                <span className="font-mono text-ink-3">{p.sales} sold</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-panel border border-line rounded-xl2">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-display text-sm font-semibold text-ink-1">Recent orders</h2>
          <Link to="/admin/orders" className="text-xs text-cyan hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
                <th className="px-5 py-2.5">Order</th>
                <th className="px-5 py-2.5">Customer</th>
                <th className="px-5 py-2.5">Method</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.recentOrders.map((o) => (
                <tr key={o._id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono text-cyan">
                    <Link to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link>
                  </td>
                  <td className="px-5 py-3 text-ink-1">{o.userName}</td>
                  <td className="px-5 py-3 text-ink-2 font-mono text-xs">{o.paymentMethod}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-3 text-xs">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3 font-mono text-right text-ink-1">
                    {formatPKR(o.total, { fromPaisa: true })}
                  </td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-3">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
