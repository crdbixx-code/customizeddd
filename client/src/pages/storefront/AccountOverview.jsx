import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AccountOverview() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [resending, setResending] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await authApi.updateProfile(pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Update failed');
    } finally {
      setSavingPw(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification email sent');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not send email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-1">Account overview</h1>

      {!user?.emailVerified && (
        <div className="flex items-center justify-between bg-amber/10 border border-amber/25 rounded-xl2 px-4 py-3">
          <p className="text-sm text-amber">Please verify your email address.</p>
          <Button size="sm" variant="secondary" onClick={resendVerification} loading={resending}>
            Resend email
          </Button>
        </div>
      )}

      <section className="bg-panel border border-line rounded-xl2 p-5">
        <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input label="Email" value={user?.email} disabled />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex items-end">
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="bg-panel border border-line rounded-xl2 p-5">
        <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Change password</h2>
        <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-4">
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
          <div className="flex items-end">
            <Button type="submit" loading={savingPw} variant="secondary">
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
