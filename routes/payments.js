/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║             PLAYBEAT — PAYMENT ROUTES                    ║
 * ║  GET  /api/payments/methods       (public logos/names)   ║
 * ║  POST /api/payments/stripe/verify                        ║
 * ║  POST /api/payments/callback/:gw  (local gw callbacks)  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  ⚠️  SECURITY: NO credentials, merchant IDs, API keys, or
 *  routing details are ever returned to the frontend.
 *  Only: gateway name, display label, logo path, enabled flag.
 */

const router     = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Order }  = require('../models');
const paymentSvc = require('../services/payments');
const { markOrderPaid } = require('./orders');

// ── PUBLIC: available payment methods (logos only) ────────────────
router.get('/methods', async (req, res) => {
  try {
    const { GatewaySettings } = require('../models');
    const gateways = await GatewaySettings.find({ enabled: true }).select('gateway');
    const enabledIds = new Set(gateways.map(g => g.gateway));

    // Fallback: always show if not yet configured in DB
    const METHODS = [
      { id: 'stripe',       label: 'Credit / Debit Card',    logo: '/images/payments/stripe.svg',    group: 'international' },
      { id: 'jazzcash',     label: 'JazzCash',               logo: '/images/payments/jazzcash.svg',  group: 'local' },
      { id: 'easypaisa',    label: 'EasyPaisa',              logo: '/images/payments/easypaisa.svg', group: 'local' },
      { id: 'alfalah',      label: 'Bank Alfalah',           logo: '/images/payments/alfalah.svg',   group: 'local' },
      { id: 'meezan',       label: 'Meezan Bank Transfer',   logo: '/images/payments/meezan.svg',    group: 'local' },
      { id: 'bank_transfer',label: 'Direct Bank Transfer',   logo: '/images/payments/bank.svg',      group: 'local' },
    ];

    // If DB has configs, filter to enabled only; else show all
    const methods = gateways.length > 0
      ? METHODS.filter(m => enabledIds.has(m.id))
      : METHODS;

    res.json({ methods });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payment methods' });
  }
});

// ── Stripe: verify after redirect ────────────────────────────────
router.post('/stripe/verify', requireAuth, async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;
    if (!sessionId || !orderId) return res.status(400).json({ error: 'Missing parameters' });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.json({ paid: true, order });

    const result = await paymentSvc.verifyStripeSession(sessionId);
    if (result.paid) {
      await markOrderPaid(order, result.gatewayRef, 'stripe');
      return res.json({ paid: true, order });
    }

    res.json({ paid: false, status: result.status });
  } catch (err) {
    console.error('[PAYMENT stripe/verify]', err);
    res.status(500).json({ error: 'Verification error' });
  }
});

// ── JazzCash callback (POST redirect) ────────────────────────────
router.post('/callback/jazzcash', async (req, res) => {
  try {
    const cfg     = await paymentSvc.getGatewayConfig('jazzcash');
    const result  = paymentSvc.verifyJazzCashCallback(req.body, cfg?.hashKey || '');

    if (!result.valid) {
      console.warn('[JAZZCASH] Invalid hash on callback');
      return res.redirect('/checkout?step=failed&reason=invalid_hash');
    }

    // Find order by pp_BillReference (order number)
    const order = await Order.findOne({ orderNumber: req.body.pp_BillReference });
    if (!order) return res.redirect('/checkout?step=failed&reason=order_not_found');

    if (result.paid) {
      await markOrderPaid(order, result.gatewayRef, 'jazzcash');
      return res.redirect(`/checkout?step=success&order=${order.orderNumber}`);
    }

    order.paymentStatus = 'failed';
    order.status        = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', by: 'jazzcash', note: `Response: ${req.body.pp_ResponseCode}` });
    await order.save();
    res.redirect(`/checkout?step=failed&order=${order.orderNumber}`);
  } catch (err) {
    console.error('[JAZZCASH callback]', err);
    res.redirect('/checkout?step=failed');
  }
});

// ── Alfalah callback ──────────────────────────────────────────────
router.post('/callback/alfalah', async (req, res) => {
  try {
    const cfg    = await paymentSvc.getGatewayConfig('alfalah');
    const result = paymentSvc.verifyAlfalahCallback(req.body, cfg?.key1, cfg?.key2);

    const order  = await Order.findOne({ orderNumber: req.body.TransactionReferenceNumber?.replace('PB','') });
    if (!order) return res.redirect('/checkout?step=failed&reason=order_not_found');

    if (result.paid) {
      await markOrderPaid(order, result.gatewayRef, 'alfalah');
      return res.redirect(`/checkout?step=success&order=${order.orderNumber}`);
    }

    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await order.save();
    res.redirect(`/checkout?step=failed&order=${order.orderNumber}`);
  } catch (err) {
    console.error('[ALFALAH callback]', err);
    res.redirect('/checkout?step=failed');
  }
});

// ── EasyPaisa callback ────────────────────────────────────────────
router.post('/callback/easypaisa', async (req, res) => {
  try {
    const paid  = req.body.responseCode === '0000';
    const txnRef = req.body.orderRefNum || '';
    const orderNumber = txnRef.replace('PB','');

    const order = await Order.findOne({ orderNumber });
    if (!order) return res.redirect('/checkout?step=failed');

    if (paid) {
      await markOrderPaid(order, req.body.transactionId, 'easypaisa');
      return res.redirect(`/checkout?step=success&order=${order.orderNumber}`);
    }

    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await order.save();
    res.redirect(`/checkout?step=failed&order=${order.orderNumber}`);
  } catch (err) {
    console.error('[EASYPAISA callback]', err);
    res.redirect('/checkout?step=failed');
  }
});

// ── Meezan / Bank transfer: customer submits proof ───────────────
router.post('/bank-proof', requireAuth, async (req, res) => {
  try {
    const { orderId, transactionId, senderName, transferDate } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.adminNote = `Bank transfer proof: TxnID=${transactionId}, Sender=${senderName}, Date=${transferDate}`;
    order.status    = 'processing';
    order.statusHistory.push({ status: 'processing', by: 'customer', note: 'Bank transfer proof submitted' });
    await order.save();

    res.json({ success: true, message: 'Proof submitted. We will verify and process your order within 24 hours.' });
  } catch (err) {
    res.status(500).json({ error: 'Submission failed' });
  }
});

// ── Validate coupon (pre-checkout) ────────────────────────────────
router.post('/validate-coupon', requireAuth, async (req, res) => {
  try {
    const { code, total } = req.body;
    const { Coupon } = require('../models');
    const coupon = await Coupon.findOne({
      code: code?.toUpperCase(), active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    if (!coupon) return res.json({ valid: false, message: 'Invalid or expired coupon' });
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return res.json({ valid: false, message: 'Coupon usage limit reached' });
    if (total < coupon.minOrder)
      return res.json({ valid: false, message: `Minimum order PKR ${coupon.minOrder} required` });

    const discount = coupon.type === 'percent'
      ? Math.round(total * coupon.value / 100)
      : Math.min(coupon.value, total);

    res.json({ valid: true, discount, type: coupon.type, value: coupon.value });
  } catch (err) {
    res.status(500).json({ error: 'Coupon validation failed' });
  }
});

module.exports = router;
