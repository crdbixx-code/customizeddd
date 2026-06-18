import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi, paymentsApi } from '../../api/orders';
import { formatPKR } from '../../lib/format';
import Button from '../../components/ui/Button';
import CouponBox from './CouponBox';
import toast from 'react-hot-toast';

const GATEWAY_LABELS = {
  stripe: 'Credit / Debit Card',
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  alfalah: 'Bank Alfalah',
  meezan: 'Meezan Bank Transfer',
  bank_transfer: 'Direct Bank Transfer',
};

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [manualResult, setManualResult] = useState(null); // for meezan/bank_transfer

  useEffect(() => {
    paymentsApi.methods().then((data) => {
      setMethods(data.methods);
      if (data.methods.length) setSelected(data.methods[0].id);
    });
  }, []);

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: { pathname: '/checkout' } } });
  }, [user, navigate]);

  if (items.length === 0 && !manualResult) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <p className="text-ink-2 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-cyan hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const discount = coupon?.discount || 0;
  const total = Math.max(subtotal - discount, 0);

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethod: selected,
        couponCode: coupon?.code || undefined,
        customerNote: note || undefined,
      };
      const res = await ordersApi.create(payload);
      const { paymentData, orderId, orderNumber } = res;

      if (selected === 'stripe' && paymentData?.sessionUrl) {
        // Stripe hosted checkout — redirect away
        localStorage.setItem('pb_pending_order', JSON.stringify({ orderId, orderNumber }));
        clearCart();
        window.location.href = paymentData.sessionUrl;
        return;
      }

      if (['jazzcash', 'easypaisa'].includes(selected) && paymentData?.apiUrl && paymentData?.payload) {
        // Submit an auto-generated form POST to the gateway
        clearCart();
        submitGatewayForm(paymentData.apiUrl, paymentData.payload);
        return;
      }

      if (paymentData?.type === 'manual_bank') {
        // Meezan / direct bank transfer — show instructions, no redirect
        clearCart();
        setManualResult({ orderId, orderNumber, ...paymentData });
        return;
      }

      // Fallback
      clearCart();
      toast.success('Order placed!');
      navigate(`/account/orders/${orderId}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (manualResult) {
    return <ManualPaymentInstructions result={manualResult} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-1 mb-6">Checkout</h1>

        <section className="bg-panel border border-line rounded-xl2 p-5 mb-6">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Order items</h2>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3 py-3">
                <img src={i.image} alt={i.name} className="h-12 w-12 rounded-lg object-cover bg-surface" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-1 line-clamp-1">{i.name}</p>
                  <p className="text-xs text-ink-3 font-mono">Qty {i.qty}</p>
                </div>
                <span className="font-mono text-sm text-ink-1">{formatPKR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-panel border border-line rounded-xl2 p-5 mb-6">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-4">Payment method</h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  selected === m.id ? 'border-cyan/60 bg-cyan/5' : 'border-line-hi hover:border-line-hi/80'
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="accent-cyan"
                />
                <span className="text-sm text-ink-1">{m.label || GATEWAY_LABELS[m.id]}</span>
              </label>
            ))}
            {methods.length === 0 && (
              <p className="text-sm text-ink-3 col-span-2">No payment methods are currently configured.</p>
            )}
          </div>
        </section>

        <section className="bg-panel border border-line rounded-xl2 p-5">
          <h2 className="font-display text-sm font-semibold text-ink-1 mb-3">Order note (optional)</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Delivery instructions, account info, etc."
            className="w-full bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 placeholder:text-ink-4 outline-none focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15"
          />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="bg-panel border border-line rounded-xl2 p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-ink-1">Summary</h2>
          <CouponBox subtotal={subtotal} coupon={coupon} setCoupon={setCoupon} />
          <div className="space-y-2 text-sm font-mono pt-1">
            <Row label="Subtotal" value={formatPKR(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`-${formatPKR(discount)}`} accent="teal" />}
            <div className="border-t border-line pt-2 flex items-center justify-between text-base">
              <span className="text-ink-1 font-semibold">Total</span>
              <span className="text-cyan font-bold">{formatPKR(total)}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!selected || methods.length === 0}
            loading={placing}
            onClick={placeOrder}
          >
            Place order
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-ink-3">
            <ShieldCheck size={13} className="text-teal" /> Your payment is processed securely
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className={accent === 'teal' ? 'text-teal' : 'text-ink-1'}>{value}</span>
    </div>
  );
}

function submitGatewayForm(actionUrl, payload) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;
  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

function ManualPaymentInstructions({ result }) {
  const info = result.ibanInfo || result.bankInfo;
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-panel border border-line rounded-xl2 p-7">
        <h1 className="font-display text-xl font-bold text-ink-1 mb-1">Complete your bank transfer</h1>
        <p className="text-sm text-ink-3 mb-6">
          Order <span className="font-mono text-cyan">{result.orderNumber}</span> has been created. Transfer
          the amount below, then submit your proof of payment.
        </p>
        <div className="bg-surface border border-line-hi rounded-lg p-4 space-y-2 font-mono text-sm">
          {info?.bank && <Row label="Bank" value={info.bank} />}
          {info?.iban && <Row label="IBAN" value={info.iban} />}
          {info?.account && <Row label="Account" value={info.account} />}
          {info?.title && <Row label="Account title" value={info.title} />}
          <Row label="Amount" value={`Rs ${info?.amount}`} />
          <Row label="Reference" value={info?.ref} />
        </div>
        <BankProofForm orderId={result.orderId} />
      </div>
    </div>
  );
}

function BankProofForm({ orderId }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ transactionId: '', senderName: '', transferDate: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await paymentsApi.submitBankProof({ orderId, ...form });
      setDone(true);
      toast.success('Proof submitted — we will verify within 24 hours.');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm text-teal mb-4">Thanks! We'll confirm your order shortly.</p>
        <Button onClick={() => navigate(`/account/orders/${orderId}`)}>View order</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <h3 className="text-sm font-medium text-ink-1">Submit transfer proof</h3>
      <input
        required
        placeholder="Transaction ID"
        value={form.transactionId}
        onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
        className="w-full bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 outline-none focus:border-cyan/60"
      />
      <input
        required
        placeholder="Sender name"
        value={form.senderName}
        onChange={(e) => setForm({ ...form, senderName: e.target.value })}
        className="w-full bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 outline-none focus:border-cyan/60"
      />
      <input
        required
        type="date"
        value={form.transferDate}
        onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
        className="w-full bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 outline-none focus:border-cyan/60"
      />
      <Button type="submit" className="w-full" loading={loading}>
        Submit proof
      </Button>
    </form>
  );
}
