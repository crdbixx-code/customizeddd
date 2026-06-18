import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatDate } from '../../lib/format';
import Badge from '../../components/ui/Badge';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listCustomers(search ? { search } : {})
      .then((data) => {
        setCustomers(data.customers);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1">Customers</h1>
        <p className="text-sm text-ink-3 mt-1">{total} registered</p>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-surface border border-line-hi rounded-lg pl-9 pr-3 py-2 text-sm text-ink-1 outline-none focus:border-cyan/50"
        />
      </div>

      <div className="bg-panel border border-line rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-3 text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-3">
                  Loading…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-3">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-ink-1">{c.name}</td>
                  <td className="px-4 py-3 text-ink-2">{c.email}</td>
                  <td className="px-4 py-3 text-ink-3 font-mono text-xs">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.emailVerified ? 'teal' : 'amber'}>
                      {c.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-3 text-xs">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-3 text-xs">
                    {c.lastLogin ? formatDate(c.lastLogin) : 'Never'}
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
