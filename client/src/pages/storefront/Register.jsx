import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created — please check your email to verify.');
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm bg-panel border border-line rounded-xl2 p-7">
        <h1 className="font-display text-xl font-bold text-ink-1 mb-1">Create account</h1>
        <p className="text-sm text-ink-3 mb-6">Registration is required to checkout</p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ali Khan"
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <Input
            label="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="03xx-xxxxxxx"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
          {error && <p className="text-xs text-coral">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-1">
            Create account
          </Button>
        </form>

        <p className="text-sm text-ink-3 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
