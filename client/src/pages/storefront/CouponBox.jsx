import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { paymentsApi } from '../../api/orders';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function CouponBox({ subtotal, coupon, setCoupon }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await paymentsApi.validateCoupon(code.trim(), subtotal / 100);
      if (!res.valid) {
        setError(res.message || 'Invalid coupon');
        setCoupon(null);
      } else {
        setCoupon({ code: code.trim().toUpperCase(), discount: res.discount * 100, type: res.type, value: res.value });
      }
    } catch {
      setError('Could not validate coupon');
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-teal/10 border border-teal/25 rounded-lg px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-teal font-mono">
          <Tag size={14} /> {coupon.code} applied
        </span>
        <button onClick={() => setCoupon(null)} className="text-ink-3 hover:text-coral">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary" onClick={apply} loading={loading}>
          Apply
        </Button>
      </div>
      {error && <p className="text-xs text-coral mt-1.5">{error}</p>}
    </div>
  );
}
