/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — AUTH ROUTES                     ║
 * ║  POST /api/auth/register                                 ║
 * ║  POST /api/auth/login                                    ║
 * ║  POST /api/auth/logout                                   ║
 * ║  GET  /api/auth/me                                       ║
 * ║  GET  /api/auth/verify-email/:token                      ║
 * ║  POST /api/auth/forgot-password                          ║
 * ║  POST /api/auth/reset-password/:token                    ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const router  = require('express').Router();
const crypto  = require('crypto');
const { User } = require('../models');
const { requireAuth, signToken } = require('../middleware/auth');
const mailer  = require('../services/mailer');

// ── REGISTER ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // Generate email verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 h

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      emailToken,
      emailTokenExpires,
    });

    // Send verification email
    await mailer.sendVerification(user.email, user.name, emailToken);

    // Auto-login after registration
    req.session.userId = user._id.toString();
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('[AUTH register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account disabled. Contact support.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    req.session.userId = user._id.toString();
    if (user.role === 'admin') req.session.isAdmin = true;

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('[AUTH login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ── GET CURRENT USER ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.toPublic ? req.user.toPublic() : req.user });
});

// ── VERIFY EMAIL ──────────────────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      emailToken: req.params.token,
      emailTokenExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

    user.emailVerified   = true;
    user.emailToken      = null;
    user.emailTokenExpires = null;
    await user.save();

    // Redirect to storefront with success
    res.redirect('/?verified=1');
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── RESEND VERIFICATION ───────────────────────────────────────────
router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    if (req.user.emailVerified) return res.json({ message: 'Email already verified' });

    const emailToken = crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(req.user._id, {
      emailToken,
      emailTokenExpires: new Date(Date.now() + 24 * 3600 * 1000),
    });

    await mailer.sendVerification(req.user.email, req.user.name, emailToken);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// ── FORGOT PASSWORD ───────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent user enumeration
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken        = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 2 * 3600 * 1000); // 2 h
    await user.save();

    await mailer.sendPasswordReset(user.email, user.name, resetToken);
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[AUTH forgot]', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    user.password          = password;
    user.resetToken        = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password updated. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ── UPDATE PROFILE ────────────────────────────────────────────────
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password too short' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ── UPDATE WISHLIST ───────────────────────────────────────────────
router.post('/wishlist/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    const idx  = user.wishlist.indexOf(productId);
    let action;

    if (idx > -1) { user.wishlist.splice(idx, 1); action = 'removed'; }
    else           { user.wishlist.push(productId); action = 'added'; }

    await user.save();
    res.json({ success: true, action, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: 'Wishlist update failed' });
  }
});

module.exports = router;
