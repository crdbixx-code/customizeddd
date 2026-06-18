import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import { formatDateTime } from '../../lib/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const GATEWAY_META = {
  stripe: {
    label: 'Stripe',
    desc: 'International credit & debit cards',
    fields: [
      { key: 'secretKey', label: 'Secret key', placeholder: 'sk_live_…' },
      { key: 'publicKey', label: 'Public key', placeholder: 'pk_live_…' },
      { key: 'webhookSecret', label: 'Webhook secret', placeholder: 'whsec_…' },
    ],
  },
  jazzcash: {
    label: 'JazzCash',
    desc: 'Mobile wallet payments',
    fields: [
      { key: 'merchantId', label: 'Merchant ID' },
      { key: 'password', label: 'Password' },
      { key: 'hashKey', label: 'Hash key' },
    ],
  },
  easypaisa: {
    label: 'EasyPaisa',
    desc: 'Mobile wallet payments',
    fields: [
      { key: 'storeId', label: 'Store ID' },
      { key: 'hashKey', label: 'Hash key' },
    ],
  },
  alfalah: {
    label: 'Bank Alfalah',
    desc: 'Hosted payment page',
    fields: [
      { key: 'channelId', label: 'Channel ID' },
      { key: 'merchantId', label: 'Merchant ID' },
      { key: 'storeId', label: 'Store ID' },
      { key: 'merchantUsername', label: 'Merchant username' },
      { key: 'merchantPassword', label: 'Merchant password' },
      { key: 'merchantHash', label: 'Merchant hash' },
    ],
  },
  meezan: {
    label: 'Meezan Bank',
    desc: 'Manual IBAN transfer, admin-verified',
    fields: [
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password' },
    ],
  },
  bank_transfer: {
    label: 'Direct Bank Transfer',
    desc: 'Manual bank transfer, admin-verified',
    fields: [],
  },
};

export default function AdminPayments() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(null);
  const [testing, setTesting] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getGateways().then((data) => setGateways(data.gateways)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleEnabled = async (g) => {
    try {
      await adminApi.updateGateway(g.gateway, { enabled: !g.enabled, sandbox: g.sandbox });
      toast.success(`${GATEWAY_META[g.gateway]?.label || g.gateway} ${!g.enabled ? 'enabled' : 'disabled'}`);
      load();
    } catch {
      toast.error('Could not update gateway');
    }
  };

  const testConnection = async (gateway) => {
    setTesting(gateway);
    try {
      const res = await adminApi.testGateway(gateway);
      toast[res.health === 'ok' ? 'success' : 'error'](res.message || res.health);
      load();
    } catch {
      toast.error('Test failed');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1">Payment gateways</h1>
        <p className="text-sm text-ink-3 mt-1">
          Credentials are stored server-side only and never exposed to the storefront.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : (
          gateways.map((g) => {
            const meta = GATEWAY_META[g.gateway] || { label: g.gateway, desc: '', fields: [] };
            return (
              <div key={g.gateway} className="bg-panel border border-line rounded-xl2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-ink-1">{meta.label}</h3>
                    <p className="text-xs text-ink-3 mt-0.5">{meta.desc}</p>
                  </div>
                  <HealthBadge health={g.health} />
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-ink-3">
                  <Badge tone={g.sandbox ? 'amber' : 'teal'}>{g.sandbox ? 'Sandbox' : 'Live'}</Badge>
                  {g.lastCheck && <span>checked {formatDateTime(g.lastCheck)}</span>}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={g.enabled ? 'danger' : 'secondary'}
                    onClick={() => toggleEnabled(g)}
                  >
                    {g.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfiguring(g.gateway)}>
                    <Settings2 size={13} /> Configure
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testConnection(g.gateway)}
                    loading={testing === g.gateway}
                  >
                    Test connection
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <GatewayConfigModal
        gateway={configuring}
        onClose={() => setConfiguring(null)}
        onSaved={load}
      />
    </div>
  );
}

function HealthBadge({ health }) {
  if (health === 'ok') return <CheckCircle2 size={18} className="text-teal" />;
  if (health === 'error') return <XCircle size={18} className="text-coral" />;
  return <HelpCircle size={18} className="text-ink-4" />;
}

function GatewayConfigModal({ gateway, onClose, onSaved }) {
  const meta = gateway ? GATEWAY_META[gateway] : null;
  const [form, setForm] = useState({});
  const [sandbox, setSandbox] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gateway) setForm({});
  }, [gateway]);

  if (!gateway) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateGateway(gateway, { ...form, sandbox, enabled: true });
      toast.success('Gateway configuration saved');
      onClose();
      onSaved();
    } catch {
      toast.error('Could not save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!gateway} onClose={onClose} title={`Configure ${meta.label}`}>
      <form onSubmit={submit} className="space-y-4">
        {meta.fields.length === 0 ? (
          <p className="text-sm text-ink-3">This gateway requires no API credentials — it's verified manually by an admin.</p>
        ) : (
          meta.fields.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              type="password"
              value={form[f.key] || ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          ))
        )}
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} className="accent-cyan" />
          Sandbox / test mode
        </label>
        <Button type="submit" className="w-full" loading={saving}>
          Save configuration
        </Button>
      </form>
    </Modal>
  );
}
