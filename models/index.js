/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — MONGOOSE MODELS                 ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ══════════════════════════════════════════════════════════════════
// ── USER MODEL ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const UserSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true, maxlength: 80 },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, required: true, minlength: 8 },
  phone:             { type: String, default: '' },
  role:              { type: String, enum: ['customer', 'admin'], default: 'customer' },

  // Email verification
  emailVerified:     { type: Boolean, default: false },
  emailToken:        { type: String, default: null },
  emailTokenExpires: { type: Date,   default: null },

  // Password reset
  resetToken:        { type: String, default: null },
  resetTokenExpires: { type: Date,   default: null },

  // Account state
  isActive:          { type: Boolean, default: true },
  lastLogin:         { type: Date,   default: null },

  // Address book
  addresses: [{
    label:   { type: String, default: 'Home' },
    line1:   String,
    city:    String,
    country: { type: String, default: 'PK' },
    isDefault: { type: Boolean, default: false },
  }],

  // Wishlist (product IDs)
  wishlist: [{ type: String }],

}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Safe public profile (no password/tokens)
UserSchema.methods.toPublic = function() {
  const { password, emailToken, resetToken, emailTokenExpires, resetTokenExpires, __v, ...pub } = this.toObject();
  return pub;
};

// ══════════════════════════════════════════════════════════════════
// ── ORDER MODEL ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName:  { type: String, required: true },

  items: [{
    productId:   { type: String, required: true },
    name:        { type: String, required: true },
    category:    { type: String },
    price:       { type: Number, required: true },   // price at time of order (PKR)
    originalPrice: { type: Number },
    qty:         { type: Number, required: true, min: 1 },
    subtotal:    { type: Number, required: true },
    image:       { type: String },
    platform:    { type: String },
  }],

  // Totals (PKR paisa)
  subtotal:     { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  total:        { type: Number, required: true },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['stripe', 'jazzcash', 'easypaisa', 'alfalah', 'meezan', 'bank_transfer'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund', 'expired'],
    default: 'pending',
  },
  paymentRef:      { type: String, default: null },   // gateway transaction/session ID
  paidAt:          { type: Date,   default: null },
  refundedAt:      { type: Date,   default: null },
  refundAmount:    { type: Number, default: 0 },
  refundReason:    { type: String, default: '' },

  // Order status
  status: {
    type: String,
    enum: ['pending_payment', 'processing', 'fulfilling', 'delivered', 'cancelled', 'refunded'],
    default: 'pending_payment',
  },

  // Delivery keys/codes (digital products)
  deliveryItems: [{
    productId: String,
    key:       String,
    notes:     String,
    deliveredAt: Date,
  }],

  // Customer notes & history
  customerNote: { type: String, default: '' },
  adminNote:    { type: String, default: '' },
  statusHistory: [{
    status:    String,
    note:      String,
    by:        String,
    at:        { type: Date, default: Date.now },
  }],

  // Coupon
  couponCode:    { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },

}, { timestamps: true });

// Auto-generate order number
OrderSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Order').countDocuments();
  this.orderNumber = `PB${String(count + 1001).padStart(6, '0')}`;
  next();
});

// ══════════════════════════════════════════════════════════════════
// ── TRANSACTION MODEL (audit log for all payment events) ──────────
// ══════════════════════════════════════════════════════════════════
const TransactionSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: { type: String },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  gateway:     { type: String, enum: ['stripe', 'jazzcash', 'easypaisa', 'alfalah', 'meezan', 'bank_transfer'] },
  type:        { type: String, enum: ['charge', 'refund', 'partial_refund', 'webhook', 'verification'] },
  status:      { type: String, enum: ['success', 'failed', 'pending', 'expired'] },

  gatewayRef:  { type: String },          // external transaction ID
  amount:      { type: Number },          // in PKR paisa
  currency:    { type: String, default: 'PKR' },

  raw:         { type: Object },          // raw gateway payload (for debugging)
  errorMessage: { type: String },

}, { timestamps: true });

// ══════════════════════════════════════════════════════════════════
// ── PAYMENT GATEWAY SETTINGS MODEL (admin-managed, server-only) ───
// ══════════════════════════════════════════════════════════════════
const GatewaySettingsSchema = new mongoose.Schema({
  gateway:  { type: String, unique: true },
  enabled:  { type: Boolean, default: false },
  sandbox:  { type: Boolean, default: true },
  config:   { type: Object, default: {} },     // encrypted credentials
  updatedBy: { type: String },
  health:   { type: String, enum: ['ok', 'error', 'untested'], default: 'untested' },
  lastCheck: { type: Date },
}, { timestamps: true });

// ══════════════════════════════════════════════════════════════════
// ── COUPON MODEL ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const CouponSchema = new mongoose.Schema({
  code:          { type: String, unique: true, uppercase: true, trim: true },
  type:          { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value:         { type: Number, required: true },
  minOrder:      { type: Number, default: 0 },
  maxUses:       { type: Number, default: 0 },     // 0 = unlimited
  usedCount:     { type: Number, default: 0 },
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt:     { type: Date, default: null },
  active:        { type: Boolean, default: true },
  categories:    [{ type: String }],               // restrict to categories (empty = all)
}, { timestamps: true });

// ══════════════════════════════════════════════════════════════════
// ── EXPORTS ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const User            = mongoose.model('User',            UserSchema);
const Order           = mongoose.model('Order',           OrderSchema);
const Transaction     = mongoose.model('Transaction',     TransactionSchema);
const GatewaySettings = mongoose.model('GatewaySettings', GatewaySettingsSchema);
const Coupon          = mongoose.model('Coupon',          CouponSchema);

module.exports = { User, Order, Transaction, GatewaySettings, Coupon };
