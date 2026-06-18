/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — WEBHOOK ROUTES                  ║
 * ║  POST /api/webhooks/stripe                               ║
 * ║  POST /api/webhooks/jazzcash                             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const router     = require('express').Router();
const { Order }  = require('../models');
const paymentSvc = require('../services/payments');
const { markOrderPaid } = require('./orders');

// ── STRIPE WEBHOOK ────────────────────────────────────────────────
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = paymentSvc.validateStripeWebhook(req.body, sig);
  } catch (err) {
    console.warn('[STRIPE webhook] Invalid signature:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status !== 'paid') break;

        const order = await Order.findById(session.metadata?.orderId);
        if (!order) break;
        if (order.paymentStatus === 'paid') break; // idempotent

        await markOrderPaid(order, session.payment_intent, 'stripe');
        console.log(`✅ [STRIPE] Order paid: ${order.orderNumber}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi  = event.data.object;
        const ref = pi.id;
        const order = await Order.findOne({ paymentRef: ref });
        if (!order) break;
        order.paymentStatus = 'failed';
        order.statusHistory.push({ status: 'cancelled', by: 'stripe', note: pi.last_payment_error?.message || 'Payment failed' });
        order.status = 'cancelled';
        await order.save();
        console.log(`❌ [STRIPE] Payment failed: ${order.orderNumber}`);
        break;
      }

      case 'charge.refunded': {
        const charge  = event.data.object;
        const order   = await Order.findOne({ paymentRef: charge.payment_intent });
        if (!order) break;
        order.paymentStatus = 'refunded';
        order.status        = 'refunded';
        order.refundedAt    = new Date();
        order.refundAmount  = charge.amount_refunded;
        order.statusHistory.push({ status: 'refunded', by: 'stripe', note: `Refund ${charge.amount_refunded} paisa` });
        await order.save();
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[STRIPE webhook] Handler error:', err);
    // Still return 200 so Stripe doesn't retry
  }

  res.json({ received: true });
});

// ── JAZZCASH IPN (server-to-server) ──────────────────────────────
router.post('/jazzcash', async (req, res) => {
  try {
    const cfg    = await paymentSvc.getGatewayConfig('jazzcash');
    const result = paymentSvc.verifyJazzCashCallback(req.body, cfg?.hashKey || '');

    if (!result.valid) {
      console.warn('[JAZZCASH IPN] Invalid hash');
      return res.sendStatus(400);
    }

    const order = await Order.findOne({ orderNumber: req.body.pp_BillReference });
    if (!order) return res.sendStatus(404);
    if (order.paymentStatus === 'paid') return res.sendStatus(200); // idempotent

    if (result.paid) {
      await markOrderPaid(order, result.gatewayRef, 'jazzcash');
      console.log(`✅ [JAZZCASH] Order paid: ${order.orderNumber}`);
    } else {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[JAZZCASH IPN]', err);
    res.sendStatus(500);
  }
});

module.exports = router;
