const express = require('express');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { ObjectId } = require('mongodb');
const { getDB } = require('./db');
const adminAuth = require('./adminAuth');

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
});

function buildAdminResponse(admin) {
  if (!admin) return null;
  return {
    id: admin._id?.toString?.(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient privileges' });
    }
    next();
  };
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing access token' });
  }

  const payload = adminAuth.verifyAccessToken(token);
  if (!payload || payload.type !== 'access' || !payload.sub) {
    return res.status(401).json({ success: false, error: 'Invalid or expired access token' });
  }

  const admin = await getDB().collection('admins').findOne({ _id: new ObjectId(payload.sub) });
  if (!admin || admin.status !== 'active') {
    return res.status(401).json({ success: false, error: 'Invalid or inactive admin account' });
  }

  req.admin = {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    name: admin.name,
  };
  next();
}

function createErrorHandler(message, status = 400) {
  return (err, req, res, next) => {
    if (err) {
      console.error('Admin route error:', err.message || err);
      return res.status(status).json({ success: false, error: message });
    }
    next();
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(12),
  role: z.literal('admin'),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
});

router.get('/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ success: true, data: { csrfToken: req.csrfToken() } });
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid login request' });
    }

    const { email, password } = parsed.data;
    const admin = await adminAuth.getAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (admin.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Admin account is disabled' });
    }

    const now = new Date();
    if (admin.lockUntil && admin.lockUntil > now) {
      return res.status(423).json({ success: false, error: 'Account temporarily locked. Try again later.' });
    }

    const validPassword = await adminAuth.verifyHash(password, admin.passwordHash);
    if (!validPassword) {
      const updates = { $inc: { failedLoginAttempts: 1 }, $set: { updatedAt: new Date() } };
      const attempts = (admin.failedLoginAttempts || 0) + 1;
      if (attempts >= adminAuth.MAX_LOGIN_ATTEMPTS) {
        updates.$set.lockUntil = new Date(Date.now() + adminAuth.LOCK_WINDOW_MS);
      }
      await getDB().collection('admins').updateOne({ _id: admin._id }, updates);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await getDB().collection('admins').updateOne({ _id: admin._id }, {
      $set: { failedLoginAttempts: 0, lockUntil: null, updatedAt: new Date() },
    });

    const accessToken = adminAuth.generateAccessToken(admin);
    const { token: refreshToken } = adminAuth.generateRefreshToken(admin);
    const refreshTokenHash = await adminAuth.hashValue(refreshToken);
    await getDB().collection('admins').updateOne({ _id: admin._id }, {
      $push: { refreshTokens: { hash: refreshTokenHash, createdAt: new Date() } },
      $set: { updatedAt: new Date() },
    });

    res.cookie(adminAuth.getRefreshCookieName(), refreshToken, adminAuth.getRefreshCookieOptions());
    res.json({ success: true, data: { accessToken, admin: buildAdminResponse(admin) } });
  } catch (err) {
    console.error('Admin login failed:', err);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

router.post('/auth/refresh', csrfProtection, async (req, res) => {
  try {
    const refreshToken = req.cookies[adminAuth.getRefreshCookieName()];
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Missing refresh token' });
    }

    const payload = adminAuth.verifyRefreshToken(refreshToken);
    if (!payload || payload.type !== 'refresh' || !payload.sub) {
      res.clearCookie(adminAuth.getRefreshCookieName(), adminAuth.getRefreshCookieOptions());
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const admin = await getDB().collection('admins').findOne({ _id: new ObjectId(payload.sub) });
    if (!admin || admin.status !== 'active') {
      res.clearCookie(adminAuth.getRefreshCookieName(), adminAuth.getRefreshCookieOptions());
      return res.status(401).json({ success: false, error: 'Invalid or inactive admin account' });
    }

    const tokenMatch = await Promise.all(
      (admin.refreshTokens || []).map(async (stored) => {
        const valid = await adminAuth.verifyHash(refreshToken, stored.hash);
        return valid ? stored.hash : null;
      })
    );
    const matchedTokenHash = tokenMatch.find(Boolean);
    if (!matchedTokenHash) {
      res.clearCookie(adminAuth.getRefreshCookieName(), adminAuth.getRefreshCookieOptions());
      return res.status(401).json({ success: false, error: 'Refresh token not recognized' });
    }

    await getDB().collection('admins').updateOne({ _id: admin._id }, {
      $pull: { refreshTokens: { hash: matchedTokenHash } },
    });

    const newAccessToken = adminAuth.generateAccessToken(admin);
    const { token: newRefreshToken } = adminAuth.generateRefreshToken(admin);
    const newRefreshHash = await adminAuth.hashValue(newRefreshToken);
    await getDB().collection('admins').updateOne({ _id: admin._id }, {
      $push: { refreshTokens: { hash: newRefreshHash, createdAt: new Date() } },
      $set: { updatedAt: new Date() },
    });

    res.cookie(adminAuth.getRefreshCookieName(), newRefreshToken, adminAuth.getRefreshCookieOptions());
    res.json({ success: true, data: { accessToken: newAccessToken, admin: buildAdminResponse(admin) } });
  } catch (err) {
    console.error('Refresh failed:', err);
    res.status(500).json({ success: false, error: 'Failed to refresh token' });
  }
});

router.post('/auth/logout', csrfProtection, async (req, res) => {
  try {
    const refreshToken = req.cookies[adminAuth.getRefreshCookieName()];
    if (refreshToken) {
      const payload = adminAuth.verifyRefreshToken(refreshToken);
      if (payload && payload.sub) {
        const admin = await getDB().collection('admins').findOne({ _id: new ObjectId(payload.sub) });
        if (admin) {
          const tokenMatch = await Promise.all(
            (admin.refreshTokens || []).map(async (stored) => {
              const valid = await adminAuth.verifyHash(refreshToken, stored.hash);
              return valid ? stored.hash : null;
            })
          );
          const matchedTokenHash = tokenMatch.find(Boolean);
          if (matchedTokenHash) {
            await getDB().collection('admins').updateOne({ _id: admin._id }, {
              $pull: { refreshTokens: { hash: matchedTokenHash } },
              $set: { updatedAt: new Date() },
            });
          }
        }
      }
    }
    res.clearCookie(adminAuth.getRefreshCookieName(), adminAuth.getRefreshCookieOptions());
    res.json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    console.error('Logout failed:', err);
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
});

router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const admin = await getDB().collection('admins').findOne({ _id: new ObjectId(req.admin.id) });
    if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });
    res.json({ success: true, data: buildAdminResponse(admin) });
  } catch (err) {
    console.error('Fetch admin me failed:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin profile' });
  }
});

router.post('/users/create-admin', authMiddleware, requireRole('super_admin'), csrfProtection, async (req, res) => {
  try {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid admin creation payload' });
    }

    const { name, email, password, role } = parsed.data;
    const existing = await adminAuth.getAdminByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Admin email already exists' });
    }

    const passwordHash = await adminAuth.hashValue(password);
    const result = await getDB().collection('admins').insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'active',
      refreshTokens: [],
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdAdmin = await getDB().collection('admins').findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, data: buildAdminResponse(createdAdmin) });
  } catch (err) {
    console.error('Create admin failed:', err);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

router.get('/users', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const admins = await getDB().collection('admins')
      .find({}, { projection: { passwordHash: 0, refreshTokens: 0, failedLoginAttempts: 0, lockUntil: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, data: admins.map(buildAdminResponse) });
  } catch (err) {
    console.error('Fetch admins failed:', err);
    res.status(500).json({ success: false, error: 'Failed to load admins' });
  }
});

router.delete('/users/:id', authMiddleware, requireRole('super_admin'), csrfProtection, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid admin id' });
    }
    if (req.admin.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    const target = await getDB().collection('admins').findOne({ _id: new ObjectId(id) });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete super admin account' });
    }

    await getDB().collection('admins').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('Delete admin failed:', err);
    res.status(500).json({ success: false, error: 'Failed to delete admin' });
  }
});

router.patch('/users/:id/status', authMiddleware, requireRole('super_admin'), csrfProtection, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid admin id' });
    }
    if (req.admin.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot change your own status' });
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const target = await getDB().collection('admins').findOne({ _id: new ObjectId(id) });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'Cannot modify super admin status' });
    }

    await getDB().collection('admins').updateOne({ _id: new ObjectId(id) }, {
      $set: { status: parsed.data.status, updatedAt: new Date() },
    });

    res.json({ success: true, data: { updated: true, status: parsed.data.status } });
  } catch (err) {
    console.error('Update admin status failed:', err);
    res.status(500).json({ success: false, error: 'Failed to update admin status' });
  }
});

module.exports = router;
