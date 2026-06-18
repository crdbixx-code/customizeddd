/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           PLAYBEAT — PAYMENT GATEWAY SERVICE             ║
 * ║  All credentials stay server-side. Frontend only sees   ║
 * ║  gateway names/logos and client_secret/redirect URLs.   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const Stripe      = require('stripe');
const crypto      = require('crypto');
const axios       = require('axios');
const { GatewaySettings, Transaction } = require('../models');

// ── Stripe instance (lazy, from DB config or env) ─────────────────
let _stripe = null;
async function getStripe() {
  if (_stripe) return _stripe;
  const cfg = await getGatewayConfig('stripe');
  const key = cfg?.secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured');
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
}

// ── Get gateway config from DB ────────────────────────────────────
async function getGatewayConfig(gateway) {
  const g = await GatewaySettings.findOne({ gateway, enabled: true });
  return g?.config || null;
}

// ── Save audit transaction ─────────────────────────────────────────
async function logTransaction(data) {
  try {
    await Transaction.create(data);
  } catch (_) { /* non-fatal */ }
}

// ══════════════════════════════════════════════════════════════════
// ── STRIPE ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function createStripeSession(order, successUrl, cancelUrl) {
  const stripe = await getStripe();
  const cfg    = await getGatewayConfig('stripe') || {};
  const isSandbox = cfg.sandbox !== false;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: order.userEmail,
    metadata: {
      orderId:     order._id.toString(),
      orderNumber: order.orderNumber,
      userId:      order.user.toString(),
    },
    line_items: order.items.map(item => ({
      price_data: {
        currency: 'pkr',
        product_data: {
          name: item.name,
          description: item.platform || undefined,
        },
        unit_amount: item.price,           // PKR in paisa (×100 already stored)
      },
      quantity: item.qty,
    })),
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`,
    cancel_url:  `${cancelUrl}?order=${order.orderNumber}`,
  });

  await logTransaction({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    gateway: 'stripe', type: 'charge', status: 'pending',
    gatewayRef: session.id, amount: order.total,
  });

  return { sessionId: session.id, sessionUrl: session.url };
}

async function verifyStripeSession(sessionId) {
  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    paid:       session.payment_status === 'paid',
    status:     session.payment_status,
    gatewayRef: session.payment_intent,
    raw:        session,
  };
}

async function createStripeRefund(paymentIntentId, amount) {
  const stripe = await getStripe();
  const params = { payment_intent: paymentIntentId };
  if (amount) params.amount = amount;
  const refund = await stripe.refunds.create(params);
  return refund;
}

// Validate Stripe webhook signature
function validateStripeWebhook(rawBody, sig) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  return stripe.webhooks.constructEvent(rawBody, sig, secret);
}

// ══════════════════════════════════════════════════════════════════
// ── JAZZCASH ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function createJazzCashRequest(order, returnUrl) {
  const cfg = await getGatewayConfig('jazzcash');
  if (!cfg) throw new Error('JazzCash not configured');

  const isSandbox  = cfg.sandbox !== false;
  const apiUrl     = isSandbox
    ? (process.env.JAZZCASH_SANDBOX_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/')
    : (process.env.JAZZCASH_PRODUCTION_URL || 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/');

  const txnRefNo   = `PB${order.orderNumber}${Date.now()}`;
  const txnAmount  = String(order.total).padStart(10, '0');
  const txnDate    = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const txnExpiry  = new Date(Date.now() + 3600000).toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

  // HMAC SHA-256 hash (JazzCash standard)
  const hashStr = [
    cfg.hashKey,
    cfg.merchantId,
    cfg.password,
    returnUrl,
    '',                       // BankID — empty for mobile wallet
    txnAmount,
    txnDate,
    txnExpiry,
    'PKR',
    txnRefNo,
    order.orderNumber,        // transaction description
    'MWALLET',                // payment type
  ].join('&');

  const hash = crypto.createHmac('sha256', cfg.hashKey).update(hashStr).digest('hex');

  const payload = {
    pp_Version:          '1.1',
    pp_TxnType:          'MWALLET',
    pp_Language:         'EN',
    pp_MerchantID:       cfg.merchantId,
    pp_Password:         cfg.password,
    pp_TxnRefNo:         txnRefNo,
    pp_Amount:           txnAmount,
    pp_TxnCurrency:      'PKR',
    pp_TxnDateTime:      txnDate,
    pp_BillReference:    order.orderNumber,
    pp_Description:      `PlayBeat Order ${order.orderNumber}`,
    pp_TxnExpiryDateTime: txnExpiry,
    pp_ReturnURL:        returnUrl,
    pp_SecureHash:       hash,
    ppmpf_1:             order.userEmail,
    ppmpf_2:             order.userName,
  };

  await logTransaction({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    gateway: 'jazzcash', type: 'charge', status: 'pending',
    gatewayRef: txnRefNo, amount: order.total,
  });

  return { apiUrl, payload, txnRefNo };
}

function verifyJazzCashCallback(body, hashKey) {
  const { pp_SecureHash, ...params } = body;
  const sortedStr = Object.keys(params).sort()
    .map(k => params[k]).join('&');
  const computed = crypto.createHmac('sha256', hashKey).update(`${hashKey}&${sortedStr}`).digest('hex');
  return {
    valid:      computed === pp_SecureHash,
    paid:       body.pp_ResponseCode === '000',
    gatewayRef: body.pp_TxnRefNo,
    raw:        body,
  };
}

// ══════════════════════════════════════════════════════════════════
// ── BANK ALFALAH ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function createAlfalahRequest(order, returnUrl) {
  const cfg = await getGatewayConfig('alfalah');
  if (!cfg) throw new Error('Bank Alfalah not configured');

  const isSandbox = cfg.sandbox !== false;
  const apiUrl    = isSandbox
    ? (process.env.ALFAPAY_API_URL || 'https://sandbox.bankalfalah.com/HS/api/HSAPI/HSAPI')
    : 'https://www.bankalfalah.com/HS/api/HSAPI/HSAPI';

  const txnRef    = `PB${order.orderNumber}`;
  const timestamp = new Date().toISOString();

  // Alfalah HS-API auth token
  const authStr   = `${cfg.merchantUsername}:${cfg.merchantPassword}`;
  const authToken = Buffer.from(authStr).toString('base64');

  const requestData = {
    ChannelId:   cfg.channelId   || '1002',
    Currency:    'PKR',
    IsBIN:       '0',
    ReturnURL:   returnUrl,
    MerchantId:  cfg.merchantId  || '197',
    StoreId:     cfg.storeId     || '000001',
    MerchantHash: cfg.merchantHash || '',
    MerchantUsername: cfg.merchantUsername,
    MerchantPassword: cfg.merchantPassword,
    TransactionTypeId: '1',
    TransactionReferenceNumber: txnRef,
    TransactionAmount: (order.total / 100).toFixed(2),  // paisa → rupees
  };

  await logTransaction({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    gateway: 'alfalah', type: 'charge', status: 'pending',
    gatewayRef: txnRef, amount: order.total,
  });

  return { apiUrl, requestData, authToken, txnRef };
}

function verifyAlfalahCallback(body, key1, key2) {
  // Alfalah response verification
  const paid = body.TransactionStatus === 'Successful' || body.ResponseCode === '00';
  return {
    paid,
    gatewayRef: body.TransactionReferenceNumber,
    raw: body,
  };
}

// ══════════════════════════════════════════════════════════════════
// ── MEEZAN BANK (Manual IBAN Transfer) ───────────────────────────
// ══════════════════════════════════════════════════════════════════
async function createMeezanRequest(order) {
  const cfg = await getGatewayConfig('meezan');
  const ibanInfo = {
    iban:    'PK86MEZN0015040115102971',
    title:   'PLAYBEAT DIGITAL PRIVATE LIMITED',
    bank:    'Meezan Bank',
    amount:  (order.total / 100).toFixed(2),
    ref:     order.orderNumber,
    note:    `Order ${order.orderNumber}`,
  };

  await logTransaction({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    gateway: 'meezan', type: 'charge', status: 'pending',
    gatewayRef: order.orderNumber, amount: order.total,
  });

  return { type: 'manual_bank', ibanInfo };
}

// ══════════════════════════════════════════════════════════════════
// ── EASYPAISA (redirect/MPIN flow) ───────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function createEasypaisaRequest(order, returnUrl) {
  const cfg = await getGatewayConfig('easypaisa');
  if (!cfg) throw new Error('EasyPaisa not configured');

  // EasyPaisa uses OTC (one-time charge) or hosted checkout
  const storeId   = cfg.storeId;
  const hashKey   = cfg.hashKey;
  const txnRef    = `PB${order.orderNumber}`;
  const amount    = (order.total / 100).toFixed(2);
  const expiryTime = new Date(Date.now() + 3600000)
    .toISOString().replace('T',' ').slice(0,19);

  const postData = {
    storeId, amount, postBackURL: returnUrl,
    orderRefNum: txnRef, expiryDate: expiryTime,
    autoRedirect: '1', recurringTxn: 'false',
    paymentMethod: 'MA_PAYMENT',
    emailAddr: order.userEmail,
  };

  // Hash
  const hashSource = Object.keys(postData).sort().map(k => postData[k]).join('');
  postData.paymentHash = crypto.createHmac('sha256', hashKey).update(hashSource).digest('hex');

  await logTransaction({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    gateway: 'easypaisa', type: 'charge', status: 'pending',
    gatewayRef: txnRef, amount: order.total,
  });

  return {
    apiUrl: 'https://easypay.easypaisa.com.pk/tpg/',
    payload: postData,
    txnRef,
  };
}

// ══════════════════════════════════════════════════════════════════
// ── GATEWAY DISPATCHER ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function initiatePayment(gateway, order, urls) {
  switch (gateway) {
    case 'stripe':       return createStripeSession(order, urls.success, urls.cancel);
    case 'jazzcash':     return createJazzCashRequest(order, urls.return);
    case 'alfalah':      return createAlfalahRequest(order, urls.return);
    case 'meezan':       return createMeezanRequest(order);
    case 'easypaisa':    return createEasypaisaRequest(order, urls.return);
    case 'bank_transfer': return {
      type: 'manual_bank',
      bankInfo: {
        bank: 'Bank Alfalah',
        account: '00681011050474',
        title: 'PLAYBEAT DIGITAL (PRIVATE LIMITED)',
        amount: (order.total / 100).toFixed(2),
        ref: order.orderNumber,
      }
    };
    default: throw new Error(`Unsupported gateway: ${gateway}`);
  }
}

module.exports = {
  initiatePayment,
  verifyStripeSession,
  validateStripeWebhook,
  createStripeRefund,
  verifyJazzCashCallback,
  verifyAlfalahCallback,
  getGatewayConfig,
  logTransaction,
};
