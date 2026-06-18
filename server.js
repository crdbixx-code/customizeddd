/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          PLAYBEAT DIGITAL — FULL STACK SERVER v2.0           ║
 * ║  Auth · Orders · Payments · Admin · Inventory · Webhooks     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const mongoose     = require('mongoose');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const path         = require('path');
const fs           = require('fs');
const rateLimit    = require('express-rate-limit');
const helmet       = require('helmet');
const cors         = require('cors');
const Stripe       = require('stripe');
const nodemailer   = require('nodemailer');

// ── Route modules ────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');
const adminRoutes    = require('./routes/admin');
const productRoutes  = require('./routes/products');
const webhookRoutes  = require('./routes/webhooks');

const app  = express();
const PORT = process.env.PORT || 3000;

// ══════════════════════════════════════════════════════════════════
// ── DATABASE CONNECTION ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB error:', err.message);
  console.log('📦 Falling back to JSON file store...');
});

// ══════════════════════════════════════════════════════════════════
// ── SECURITY MIDDLEWARE ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

// Stripe webhooks need raw body — mount BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/jazzcash', express.urlencoded({ extended: true }));
app.use('/api/webhooks/alfalah', express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://fonts.googleapis.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https://placehold.co"],
      frameSrc:   ["https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiters
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  message: { error: 'Too many auth attempts' } });
const checkoutLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, message: { error: 'Too many checkout attempts' } });

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/orders/', checkoutLimiter);

// Body parsers (after raw webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (MongoDB-backed)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'playbeat-secret-2025',
  resave: false,
  saveUninitialized: false,
  store: mongoose.connection.readyState === 1
    ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI, ttl: 7 * 24 * 3600 })
    : undefined,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

// Static files
// Legacy static assets (images, payment logos, etc. — NOT the old HTML pages)
app.use(express.static(path.join(__dirname, 'public')));

// React storefront + admin build (see client/README.md — run `npm run build` in /client)
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
const clientBuildExists = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));
if (clientBuildExists) {
  app.use(express.static(CLIENT_DIST));
}

// ══════════════════════════════════════════════════════════════════
// ── ROUTE MOUNTING ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api',          productRoutes);   // /api/products, /api/categories, /api/settings, /api/stats
app.use('/api/webhooks', webhookRoutes);

// ── SPA fallback ───────────────────────────────────────────────────
// React Router handles /, /checkout, /account/*, /admin/* etc. client-side,
// so any non-API GET request should resolve to the client's index.html.
app.get(/^(?!\/api).*/, (req, res, next) => {
  if (!clientBuildExists) {
    return res
      .status(503)
      .send('Client build not found. Run `npm install && npm run build` inside /client, then restart this server.');
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🎮 PlayBeat Digital running at http://localhost:${PORT}`);
  console.log(`🔐 Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`🛒 Checkout:     http://localhost:${PORT}/checkout`);
  console.log(`👤 Account:      http://localhost:${PORT}/account\n`);
  if (!clientBuildExists) {
    console.log('⚠️  client/dist not found — build the React app first (see client/README.md)\n');
  }
});

module.exports = app;
