import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.login(password);
      sessionStorage.setItem('pb_admin', '1');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-panel border border-line rounded-xl2 p-7">
        <div className="h-11 w-11 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan mb-4">
          <ShieldCheck size={20} />
        </div>
        <h1 className="font-display text-xl font-bold text-ink-1 mb-1">Admin panel</h1>
        <p className="text-sm text-ink-3 mb-6">playbeat administration</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Admin password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
          {error && <p className="text-xs text-coral">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
