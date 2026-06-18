/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — ORDER ROUTES                    ║
 * ║  POST /api/orders                 (create + initiate)    ║
 * ║  GET  /api/orders                 (user's orders)        ║
 * ║  GET  /api/orders/:id             (single order)         ║
 * ║  POST /api/orders/:id/verify      (payment verification) ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const router   = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Order, Coupon } = require('../models');
const paymentSvc = require('../services/payments');
const mailer     = require('../services/mailer');
const productSvc = require('../services/products');

const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// ── CREATE ORDER + INITIATE PAYMENT ───────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, paymentMethod, couponCode, customerNote } = req.body;

    if (!items?.length)
      return res.status(400).json({ error: 'Cart is empty' });

    const ALLOWED_GATEWAYS = ['stripe','jazzcash','easypaisa','alfalah','meezan','bank_transfer'];
    if (!ALLOWED_GATEWAYS.includes(paymentMethod))
      return res.status(400).json({ error: 'Invalid payment method' });

    // Validate + price items from DB (never trust frontend prices)
    const enriched = [];
    for (const item of items) {
      const product = await productSvc.findProduct(item.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for: ${product.name}` });

      enriched.push({
        productId:     product.id,
        name:          product.name,
        category:      product.category,
        price:         product.price * 100,       // store in paisa
        originalPrice: (product.originalPrice || product.price) * 100,
        qty:           item.qty,
        subtotal:      product.price * item.qty * 100,
        image:         product.image || '',
        platform:      product.platform || '',
      });
    }

    const subtotal = enriched.reduce((s, i) => s + i.subtotal, 0);

    // Coupon validation
    let discount = 0, couponDiscount = 0, validCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(), active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });
      if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon' });
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      if (subtotal < coupon.minOrder * 100)
        return res.status(400).json({ error: `Minimum order PKR ${coupon.minOrder} required for this coupon` });

      if (coupon.type === 'percent') {
        couponDiscount = Math.round(subtotal * coupon.value / 100);
      } else {
        couponDiscount = Math.min(coupon.value * 100, subtotal);
      }
      discount   = couponDiscount;
      validCoupon = coupon;
    }

    const total = Math.max(subtotal - discount, 0);

    const order = await Order.create({
      user:          req.user._id,
      userEmail:     req.user.email,
      userName:      req.user.name,
      items:         enriched,
      subtotal,
      discount,
      total,
      paymentMethod,
      couponCode:    couponCode || '',
      couponDiscount,
      customerNote:  customerNote || '',
      statusHistory: [{ status: 'pending_payment', by: 'system', note: 'Order created' }],
    });

    // Mark coupon used
    if (validCoupon) {
      validCoupon.usedCount++;
      validCoupon.usedBy.push(req.user._id);
      await validCoupon.save();
    }

    // Deduct stock optimistically
    for (const item of enriched) {
      await productSvc.decrementStock(item.productId, item.qty);
    }

    // Initiate payment
    const urls = {
      success: `${BASE_URL()}/checkout?step=success`,
      cancel:  `${BASE_URL()}/checkout?step=cancel`,
      return:  `${BASE_URL()}/api/payments/callback/${paymentMethod}`,
    };

    const paymentData = await paymentSvc.initiatePayment(paymentMethod, order, urls);

    // Save payment reference if available
    if (paymentData.sessionId)  { order.paymentRef = paymentData.sessionId; await order.save(); }
    if (paymentData.txnRef)     { order.paymentRef = paymentData.txnRef;    await order.save(); }

    res.json({
      success:     true,
      orderId:     order._id,
      orderNumber: order.orderNumber,
      paymentData,             // contains Stripe sessionUrl OR JazzCash form fields
    });
  } catch (err) {
    console.error('[ORDER create]', err);
    res.status(500).json({ error: err.message || 'Order creation failed' });
  }
});

// ── LIST USER ORDERS ──────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-statusHistory -adminNote -deliveryItems');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── SINGLE ORDER ──────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── VERIFY PAYMENT (polled from frontend after Stripe redirect) ───
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.json({ paid: true, order });

    if (order.paymentMethod === 'stripe' && order.paymentRef) {
      const result = await paymentSvc.verifyStripeSession(order.paymentRef);
      if (result.paid) {
        await markOrderPaid(order, result.gatewayRef, 'stripe');
        return res.json({ paid: true, order });
      }
    }

    res.json({ paid: false, status: order.paymentStatus });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── Shared: mark order paid + trigger fulfilment ──────────────────
async function markOrderPaid(order, gatewayRef, gateway) {
  order.paymentStatus = 'paid';
  order.paymentRef    = gatewayRef || order.paymentRef;
  order.paidAt        = new Date();
  order.status        = 'processing';
  order.statusHistory.push({ status: 'processing', by: 'system', note: `${gateway} payment confirmed` });
  await order.save();

  // Send confirmation email
  try {
    await mailer.sendOrderConfirmation(order);
  } catch (_) { /* non-fatal */ }

  return order;
}

module.exports = router;
module.exports.markOrderPaid = markOrderPaid;
