/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               PLAYBEAT — AUTH MIDDLEWARE                 ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const jwt  = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'playbeat-jwt-secret-change-in-production';

// ── Generate tokens ───────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Require authenticated user (JWT or session) ───────────────────
async function requireAuth(req, res, next) {
  try {
    // 1. Try Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -emailToken -resetToken');
      if (!user || !user.isActive) return res.status(401).json({ error: 'Account not found or disabled' });
      req.user = user;
      return next();
    }

    // 2. Try session
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId).select('-password -emailToken -resetToken');
      if (!user || !user.isActive) return res.status(401).json({ error: 'Session expired' });
      req.user = user;
      return next();
    }

    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Require admin role ────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  // Support legacy admin session (backwards compat)
  if (req.session?.isAdmin) return next();

  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// ── Soft auth (attach user if logged in, don't block) ────────────
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -emailToken -resetToken');
    } else if (req.session?.userId) {
      req.user = await User.findById(req.session.userId).select('-password -emailToken -resetToken');
    }
  } catch (_) { /* ignore */ }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth, signToken };
