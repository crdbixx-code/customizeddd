import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sysInfo, setSysInfo] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(setSettings);
    adminApi.systemInfo().then(setSysInfo);
  }, []);

  if (!settings) return <p className="text-sm text-ink-3">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(settings);
      setSettings(res.settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await adminApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Admin password updated');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not update password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ink-1">Site settings</h1>

      <form onSubmit={save} className="bg-panel border border-line rounded-xl2 p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold text-ink-1">Storefront</h2>
        <Input
          label="Site name"
          value={settings.siteName || ''}
          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
        />
        <Input
          label="Hero headline"
          value={settings.heroHeadline || ''}
          onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
        />
        <Input
          label="Hero subtitle"
          value={settings.heroSubtitle || ''}
          onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
        />
        <Input
          label="Hero badge"
          value={settings.heroBadge || ''}
          onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
        />
        <Input
          label="Announcement bar"
          value={settings.announcementBar || ''}
          onChange={(e) => setSettings({ ...settings, announcementBar: e.target.value })}
        />
        <div className="grid sm:grid-cols-3 gap-4">
          <Input
            label="WhatsApp number"
            value={settings.whatsapp || ''}
            onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
          />
          <Input
            label="Telegram handle"
            value={settings.telegram || ''}
            onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
          />
          <Input
            label="Support email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-5 pt-1">
          <Toggle
            label="Cart enabled"
            checked={settings.cartEnabled}
            onChange={(v) => setSettings({ ...settings, cartEnabled: v })}
          />
          <Toggle
            label="Wishlist enabled"
            checked={settings.wishlistEnabled}
            onChange={(v) => setSettings({ ...settings, wishlistEnabled: v })}
          />
          <Toggle
            label="Maintenance mode"
            checked={settings.maintenanceMode}
            onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
          />
        </div>
        <Button type="submit" loading={saving}>
          Save settings
        </Button>
      </form>

      <form onSubmit={changePassword} className="bg-panel border border-line rounded-xl2 p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold text-ink-1">Admin password</h2>
        <Input
          label="Current password"
          type="password"
          required
          value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
        />
        <Input
          label="New password"
          type="password"
          required
          minLength={8}
          value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
        />
        <Button type="submit" variant="secondary" loading={savingPw}>
          Update password
        </Button>
      </form>

      {sysInfo && (
        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-3">System info</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm font-mono">
            <Info label="Database" value={sysInfo.database} />
            <Info label="Node version" value={sysInfo.nodeVersion} />
            <Info label="Uptime" value={sysInfo.uptime} />
            <Info label="Environment" value={sysInfo.environment} />
          </dl>
        </section>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-cyan" />
      {label}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-ink-3 text-xs">{label}</dt>
      <dd className="text-ink-1">{value}</dd>
    </div>
  );
}
