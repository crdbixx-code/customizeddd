import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated — please log in.');
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm bg-panel border border-line rounded-xl2 p-7">
        <h1 className="font-display text-xl font-bold text-ink-1 mb-1">Set new password</h1>
        <form onSubmit={submit} className="flex flex-col gap-4 mt-5">
          <Input
            label="New password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          {error && <p className="text-xs text-coral">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
        <p className="text-sm text-ink-3 mt-6 text-center">
          <Link to="/login" className="text-cyan hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
