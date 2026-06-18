import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm bg-panel border border-line rounded-xl2 p-7">
        <h1 className="font-display text-xl font-bold text-ink-1 mb-1">Reset password</h1>
        <p className="text-sm text-ink-3 mb-6">We'll email you a reset link.</p>

        {sent ? (
          <p className="text-sm text-teal bg-teal/10 border border-teal/20 rounded-lg p-3">
            If that email exists, a reset link has been sent.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-sm text-ink-3 mt-6 text-center">
          <Link to="/login" className="text-cyan hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
