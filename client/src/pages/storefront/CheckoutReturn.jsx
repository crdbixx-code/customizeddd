import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paymentsApi } from '../../api/orders';
import Button from '../../components/ui/Button';

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | paid | failed
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const sessionId = params.get('session_id');
    const cached = JSON.parse(localStorage.getItem('pb_pending_order') || 'null');
    const id = cached?.orderId;
    setOrderId(id);

    if (!sessionId || !id) {
      setStatus('failed');
      return;
    }

    paymentsApi
      .verifyStripe(sessionId, id)
      .then((res) => {
        setStatus(res.paid ? 'paid' : 'failed');
        if (res.paid) localStorage.removeItem('pb_pending_order');
      })
      .catch(() => setStatus('failed'));
  }, [params]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'checking' && (
          <>
            <Loader2 className="animate-spin mx-auto text-cyan mb-4" size={36} />
            <h1 className="font-display text-lg font-semibold text-ink-1">Verifying payment…</h1>
            <p className="text-sm text-ink-3 mt-1">This will only take a moment.</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <CheckCircle2 className="mx-auto text-teal mb-4" size={44} />
            <h1 className="font-display text-lg font-semibold text-ink-1">Payment successful</h1>
            <p className="text-sm text-ink-3 mt-1 mb-6">Your order is being processed.</p>
            <Button onClick={() => navigate(`/account/orders/${orderId}`)}>View order</Button>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="mx-auto text-coral mb-4" size={44} />
            <h1 className="font-display text-lg font-semibold text-ink-1">Payment not confirmed</h1>
            <p className="text-sm text-ink-3 mt-1 mb-6">
              If you completed payment, check your orders in a few minutes.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/account/orders">
                <Button variant="secondary">My orders</Button>
              </Link>
              <Link to="/">
                <Button>Back to store</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
