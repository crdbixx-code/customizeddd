/**
 * PLAYBEAT — EMAIL SERVICE
 * Transactional emails: verification, reset, order confirmation, delivery
 */

const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST    || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE  === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL || 'support@playbeat.pk',
      pass: process.env.SMTP_PASS,
    },
  });
}

const BASE = () => process.env.BASE_URL || 'https://playbeat.pk';
const BRAND = `
  <div style="background:#0a1628;padding:20px 32px;border-radius:12px 12px 0 0;border-bottom:2px solid #00d4ff">
    <span style="font-family:monospace;font-size:22px;font-weight:900;color:#f5c842">PLAY</span>
    <span style="font-family:monospace;font-size:22px;font-weight:900;color:#00d4ff">BEAT</span>
    <span style="font-size:12px;color:#6a8fb5;margin-left:8px">Digital Store</span>
  </div>`;

function wrap(title, body) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#05070d;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;border-radius:12px;overflow:hidden;border:1px solid rgba(0,212,255,.2)">
    ${BRAND}
    <div style="background:#0d1a2e;padding:32px;color:#e4f0ff">
      <h2 style="color:#00d4ff;margin:0 0 16px">${title}</h2>
      ${body}
    </div>
    <div style="background:#0a1628;padding:16px 32px;text-align:center;color:#2e4a6e;font-size:12px">
      PlayBeat Digital · support@playbeat.pk · <a href="https://wa.me/923318333368" style="color:#00d4ff">WhatsApp Support</a>
    </div>
  </div></body></html>`;
}

async function sendVerification(email, name, token) {
  const url = `${BASE()}/api/auth/verify-email/${token}`;
  const html = wrap('Verify Your Email', `
    <p>Hi <strong>${name}</strong>,</p>
    <p style="color:#6a8fb5">Please verify your email to complete registration:</p>
    <a href="${url}" style="display:inline-block;background:#00d4ff;color:#05070d;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin:20px 0">Verify Email →</a>
    <p style="color:#2e4a6e;font-size:12px">Link expires in 24 hours. If you didn't register, ignore this email.</p>
  `);
  return send(email, '✅ Verify your PlayBeat account', html);
}

async function sendPasswordReset(email, name, token) {
  const url = `${BASE()}/reset-password?token=${token}`;
  const html = wrap('Reset Your Password', `
    <p>Hi <strong>${name}</strong>,</p>
    <p style="color:#6a8fb5">Click below to reset your password. Link expires in 2 hours.</p>
    <a href="${url}" style="display:inline-block;background:#f5c842;color:#05070d;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin:20px 0">Reset Password →</a>
    <p style="color:#2e4a6e;font-size:12px">If you didn't request this, you can safely ignore it.</p>
  `);
  return send(email, '🔑 Reset your PlayBeat password', html);
}

async function sendOrderConfirmation(order) {
  const itemsHtml = order.items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);color:#e4f0ff">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);color:#6a8fb5;text-align:center">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);color:#f5c842;text-align:right">PKR ${Math.round(i.subtotal/100).toLocaleString()}</td>
    </tr>`).join('');

  const html = wrap(`Order Confirmed — ${order.orderNumber}`, `
    <p>Hi <strong>${order.userName}</strong>, your order has been received!</p>
    <div style="background:#0a1628;border-radius:8px;padding:16px;margin:16px 0">
      <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
      <div style="padding:12px 0 0;display:flex;justify-content:space-between;color:#00d4ff;font-weight:700">
        <span>Total</span><span>PKR ${Math.round(order.total/100).toLocaleString()}</span>
      </div>
    </div>
    <p style="color:#6a8fb5">Payment: <strong style="color:#e4f0ff">${order.paymentMethod.toUpperCase()}</strong></p>
    <p style="color:#6a8fb5">Order #: <strong style="color:#00d4ff">${order.orderNumber}</strong></p>
    <p style="color:#6a8fb5;font-size:13px">We'll process your order and deliver your digital keys shortly. 
    <a href="https://wa.me/923318333368" style="color:#00d4ff">WhatsApp us</a> if you need help.</p>
  `);
  return send(order.userEmail, `🎮 Order Confirmed — ${order.orderNumber}`, html);
}

async function sendOrderDelivered(order) {
  const keysHtml = (order.deliveryItems || []).map(i => `
    <div style="background:#0a1628;border:1px solid rgba(0,255,204,.2);border-radius:8px;padding:14px;margin:8px 0">
      <div style="color:#00ffcc;font-size:12px;text-transform:uppercase;letter-spacing:.1em">${i.productId}</div>
      <div style="color:#f5c842;font-family:monospace;font-size:18px;margin:6px 0">${i.key}</div>
      ${i.notes ? `<div style="color:#6a8fb5;font-size:12px">${i.notes}</div>` : ''}
    </div>`).join('');

  const html = wrap(`🎉 Your Order is Delivered — ${order.orderNumber}`, `
    <p>Hi <strong>${order.userName}</strong>, your digital order is ready!</p>
    ${keysHtml || '<p style="color:#6a8fb5">Your product has been delivered to your account.</p>'}
    <p style="color:#6a8fb5;font-size:13px;margin-top:20px">
      Keep this email safe. For support: <a href="https://wa.me/923318333368" style="color:#00d4ff">WhatsApp</a>
      or <a href="mailto:support@playbeat.pk" style="color:#00d4ff">email us</a>.
    </p>
  `);
  return send(order.userEmail, `🎮 Your PlayBeat keys are ready — ${order.orderNumber}`, html);
}

async function send(to, subject, html) {
  if (!process.env.SMTP_PASS) {
    console.log(`[MAILER] Skipped (no SMTP config): ${subject} → ${to}`);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"PlayBeat Digital" <${process.env.SMTP_USER || 'support@playbeat.pk'}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error('[MAILER]', err.message);
  }
}

module.exports = { sendVerification, sendPasswordReset, sendOrderConfirmation, sendOrderDelivered };
