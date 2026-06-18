/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — ADMIN ROUTES                    ║
 * ║  All routes require admin authentication                 ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const router   = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { Order, Transaction, GatewaySettings, Coupon, User } = require('../models');
const productSvc = require('../services/products');
const paymentSvc = require('../services/payments');
const mailer     = require('../services/mailer');

// All admin routes require auth
router.use(requireAdmin);

// ══════════════════════════════════════════════════════════════════
// ── AUTH ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  // Legacy password login for admin panel
  const { password } = req.body;
  const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'playbeat2025';
  if (password !== ADMIN_PASS) return res.status(401).json({ error: 'Invalid password' });
  req.session.isAdmin   = true;
  req.session.loginTime = new Date().toISOString();
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/check', (req, res) => {
  res.json({ isAdmin: !!(req.session?.isAdmin) });
});

// ══════════════════════════════════════════════════════════════════
// ── DASHBOARD ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const data = productSvc.readData();

    // Order stats from DB
    const [totalOrders, paidOrders, revenueAgg, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(10)
        .select('orderNumber userName total status createdAt paymentMethod'),
    ]);

    const totalRevenuePaisa = revenueAgg[0]?.total || 0;

    // Product stats from JSON
    const totalSales = data.products.reduce((s, p) => s + (p.sales || 0), 0);
    const lowStock   = data.products.filter(p => p.stock < 20).length;
    const outOfStock = data.products.filter(p => p.stock === 0).length;
    // Top products from JSON store (consistent shape for admin UI)
    const topProducts = [...data.products].sort((a, b) => (b.sales||0) - (a.sales||0)).slice(0, 5);

    const byCategory = data.categories.map(c => ({
      category: c.name, icon: c.icon, color: c.color,
      count:    data.products.filter(p => p.category === c.id).length,
      revenue:  data.products.filter(p => p.category === c.id)
                  .reduce((s, p) => s + (p.price * (p.sales || 0)), 0),
    }));

    res.json({
      totalRevenue:    Math.round(totalRevenuePaisa / 100),
      totalOrders,
      paidOrders,
      totalProducts:   data.products.length,
      totalSales,
      lowStock,
      outOfStock,
      featuredCount:   data.products.filter(p => p.featured).length,
      trendingCount:   data.products.filter(p => p.trending).length,
      recentOrders,
      topProducts,
      byCategory,
    });
  } catch (err) {
    console.error('[ADMIN dashboard]', err);
    res.status(500).json({ error: 'Dashboard failed' });
  }
});

// ══════════════════════════════════════════════════════════════════
// ── PRODUCTS (JSON store) ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.post('/products', async (req, res) => {
  try {
    const data = productSvc.readData();
    const newProduct = {
      id: 'p' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      sales: 0, rating: 4.5, reviews: 0,
      ...req.body,
      price:         parseInt(req.body.price)         || 0,
      originalPrice: parseInt(req.body.originalPrice) || 0,
      stock:         parseInt(req.body.stock)         || 0,
      featured: req.body.featured === 'true' || req.body.featured === true,
      trending: req.body.trending === 'true' || req.body.trending === true,
      tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags?.split(',').map(t => t.trim()) || []),
    };
    newProduct.discount = newProduct.originalPrice > 0
      ? Math.round((1 - newProduct.price / newProduct.originalPrice) * 100) : 0;

    data.products.push(newProduct);
    const cat = data.categories.find(c => c.id === newProduct.category);
    if (cat) cat.count = data.products.filter(p => p.category === cat.id).length;
    productSvc.writeData(data);
    res.json({ success: true, product: newProduct });
  } catch (err) { res.status(500).json({ error: 'Failed to create product' }); }
});

router.put('/products/:id', async (req, res) => {
  try {
    const data = productSvc.readData();
    const idx  = data.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const updated = { ...data.products[idx], ...req.body };
    updated.price         = parseInt(updated.price)         || 0;
    updated.originalPrice = parseInt(updated.originalPrice) || 0;
    updated.stock         = parseInt(updated.stock)         || 0;
    updated.discount      = updated.originalPrice > 0
      ? Math.round((1 - updated.price / updated.originalPrice) * 100) : 0;
    updated.featured = req.body.featured === 'true' || req.body.featured === true;
    updated.trending = req.body.trending === 'true' || req.body.trending === true;
    if (req.body.tags && !Array.isArray(req.body.tags))
      updated.tags = req.body.tags.split(',').map(t => t.trim());

    data.products[idx] = updated;
    productSvc.writeData(data);
    res.json({ success: true, product: updated });
  } catch (err) { res.status(500).json({ error: 'Failed to update product' }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const data = productSvc.readData();
    data.products = data.products.filter(p => p.id !== req.params.id);
    productSvc.writeData(data);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete product' }); }
});

router.post('/products/bulk', async (req, res) => {
  try {
    const data = productSvc.readData();
    const { ids, action, value } = req.body;
    ids.forEach(id => {
      const p = data.products.find(p => p.id === id);
      if (!p) return;
      if (action === 'delete')   data.products = data.products.filter(x => x.id !== id);
      if (action === 'feature')  p.featured = value;
      if (action === 'trending') p.trending = value;
      if (action === 'stock')    p.stock    = parseInt(value) || 0;
    });
    productSvc.writeData(data);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Bulk operation failed' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── CATEGORIES ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.post('/categories', async (req, res) => {
  const data = productSvc.readData();
  data.categories.push({ id: req.body.id, name: req.body.name, icon: req.body.icon || '📦', color: req.body.color || '#00d4ff', count: 0 });
  productSvc.writeData(data);
  res.json({ success: true });
});

router.delete('/categories/:id', async (req, res) => {
  const data = productSvc.readData();
  data.categories = data.categories.filter(c => c.id !== req.params.id);
  productSvc.writeData(data);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════
// ── SITE SETTINGS ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/settings', async (req, res) => {
  res.json(productSvc.readData().settings);
});

router.put('/settings', async (req, res) => {
  const data = productSvc.readData();
  data.settings = { ...data.settings, ...req.body };
  productSvc.writeData(data);
  res.json({ success: true, settings: data.settings });
});

// ══════════════════════════════════════════════════════════════════
// ── PAYMENT GATEWAY CONFIGURATION ────────────────────────────────
// ══════════════════════════════════════════════════════════════════

// GET all gateway statuses (no secrets returned)
router.get('/gateways', async (req, res) => {
  try {
    const gateways = await GatewaySettings.find().select('-config');
    const KNOWN = ['stripe','jazzcash','easypaisa','alfalah','meezan','bank_transfer'];
    const result = KNOWN.map(id => {
      const g = gateways.find(x => x.gateway === id);
      return {
        gateway:  id,
        enabled:  g?.enabled  || false,
        sandbox:  g?.sandbox  || true,
        health:   g?.health   || 'untested',
        lastCheck: g?.lastCheck || null,
        updatedAt: g?.updatedAt || null,
      };
    });
    res.json({ gateways: result });
  } catch (err) { res.status(500).json({ error: 'Failed to load gateways' }); }
});

// PUT gateway config (credentials stored server-side only)
router.put('/gateways/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const { enabled, sandbox, ...credentials } = req.body;

    // Never log credentials
    await GatewaySettings.findOneAndUpdate(
      { gateway },
      {
        gateway,
        enabled: enabled === true || enabled === 'true',
        sandbox: sandbox !== false && sandbox !== 'false',
        config: credentials,       // stored encrypted at rest by MongoDB + env
        updatedBy: 'admin',
        health: 'untested',
      },
      { upsert: true, new: true }
    );

    // Reset stripe instance if updated
    if (gateway === 'stripe') { /* force re-init on next request */ }

    res.json({ success: true, message: `${gateway} configuration saved` });
  } catch (err) {
    console.error('[ADMIN gateways]', err);
    res.status(500).json({ error: 'Failed to save gateway config' });
  }
});

// POST test gateway connection
router.post('/gateways/:gateway/test', async (req, res) => {
  try {
    const { gateway } = req.params;
    let health = 'error', message = '';

    if (gateway === 'stripe') {
      try {
        const stripe = await (async () => {
          const { getStripe } = require('../services/payments');
          // We call balance as a simple API health check
          const Stripe = require('stripe');
          const cfg    = await paymentSvc.getGatewayConfig('stripe');
          const key    = cfg?.secretKey || process.env.STRIPE_SECRET_KEY;
          if (!key) throw new Error('No key');
          const s = new Stripe(key, { apiVersion: '2024-06-20' });
          await s.balance.retrieve();
          return s;
        })();
        health = 'ok'; message = 'Stripe connection successful';
      } catch (e) { message = e.message; }
    } else {
      // For local gateways just verify config is present
      const cfg = await paymentSvc.getGatewayConfig(gateway);
      if (cfg && Object.keys(cfg).length > 0) { health = 'ok'; message = 'Config present'; }
      else { message = 'No configuration found'; }
    }

    await GatewaySettings.findOneAndUpdate({ gateway }, { health, lastCheck: new Date() });
    res.json({ health, message });
  } catch (err) { res.status(500).json({ error: 'Test failed' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── ORDERS (admin view) ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/orders', async (req, res) => {
  try {
    const { status, payment, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status)  query.status        = status;
    if (payment) query.paymentStatus = payment;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(parseInt(limit))
        .select('-deliveryItems'),
      Order.countDocuments(query),
    ]);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json({ order });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    order.status = status;
    order.statusHistory.push({ status, by: 'admin', note: note || '' });
    await order.save();

    if (status === 'delivered') {
      try { await mailer.sendOrderDelivered(order); } catch (_) {}
    }

    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ error: 'Status update failed' }); }
});

router.post('/orders/:id/deliver', async (req, res) => {
  try {
    const { items } = req.body;   // [{ productId, key, notes }]
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    order.deliveryItems = items.map(i => ({ ...i, deliveredAt: new Date() }));
    order.status = 'delivered';
    order.statusHistory.push({ status: 'delivered', by: 'admin', note: 'Keys delivered' });
    await order.save();

    try { await mailer.sendOrderDelivered(order); } catch (_) {}

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Delivery failed' }); }
});

router.post('/orders/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.paymentStatus !== 'paid') return res.status(400).json({ error: 'Order not paid' });

    if (order.paymentMethod === 'stripe' && order.paymentRef) {
      const amountPaisa = amount ? parseInt(amount) * 100 : undefined;
      await paymentSvc.createStripeRefund(order.paymentRef, amountPaisa);
    }

    order.paymentStatus = amount ? 'partial_refund' : 'refunded';
    order.status        = 'refunded';
    order.refundedAt    = new Date();
    order.refundAmount  = amount || (order.total / 100);
    order.refundReason  = reason || '';
    order.statusHistory.push({ status: 'refunded', by: 'admin', note: reason || 'Admin refund' });
    await order.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message || 'Refund failed' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── TRANSACTIONS ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/transactions', async (req, res) => {
  try {
    const { gateway, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (gateway) query.gateway = gateway;
    if (status)  query.status  = status;

    const txns = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit))
      .select('-raw');
    const total = await Transaction.countDocuments(query);
    res.json({ transactions: txns, total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch transactions' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── COUPONS ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).select('-usedBy');
    res.json({ coupons });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch coupons' }); }
});

router.post('/coupons', async (req, res) => {
  try {
    const coupon = await Coupon.create({
      code:      req.body.code?.toUpperCase(),
      type:      req.body.type  || 'percent',
      value:     parseInt(req.body.value),
      minOrder:  parseInt(req.body.minOrder) || 0,
      maxUses:   parseInt(req.body.maxUses)  || 0,
      expiresAt: req.body.expiresAt || null,
      categories: req.body.categories || [],
    });
    res.json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) { res.status(500).json({ error: 'Failed to update coupon' }); }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete coupon' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── CUSTOMERS ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = search ? { $or: [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]} : {};
    const users = await User.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit))
      .select('-password -emailToken -resetToken');
    const total = await User.countDocuments(query);
    res.json({ customers: users, total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch customers' }); }
});

// ══════════════════════════════════════════════════════════════════
// ── ADMIN PASSWORD CHANGE ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'playbeat2025';
    if (currentPassword !== ADMIN_PASS)
      return res.status(401).json({ error: 'Current password incorrect' });
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    // Update env (runtime only — persist via env file in production)
    process.env.ADMIN_PASSWORD = newPassword;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Password update failed' }); }
});

// ── SYSTEM INFO ───────────────────────────────────────────────────
router.get('/system-info', async (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    database:    mongoose.connection.readyState === 1 ? 'MongoDB (Connected)' : 'JSON File Store',
    nodeVersion: process.version,
    uptime:      Math.round(process.uptime()) + 's',
    environment: process.env.NODE_ENV || 'development',
  });
});


module.exports = router;
