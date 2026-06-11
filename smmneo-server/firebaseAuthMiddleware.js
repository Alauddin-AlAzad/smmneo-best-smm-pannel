const { verifyIdToken, getFirebaseAdmin } = require('./firebaseAdmin');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
const additionalAllowedOrigins = (process.env.CLIENT_ORIGINS || 'https://azad-develop.web.app,https://azad-develop.firebaseapp.com,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  CLIENT_ORIGIN,
  ...additionalAllowedOrigins,
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function authMiddleware(req, res, next) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Invalid authorization header format' });
  }

  try {
    const { app } = getFirebaseAdmin();
    if (!app) {
      return res.status(503).json({ success: false, error: 'Firebase Auth unavailable' });
    }
  } catch (err) {
    return res.status(503).json({ success: false, error: 'Firebase Auth initialization failed', message: err.message });
  }

  verifyIdToken(token)
    .then((decoded) => {
      req.user = decoded;
      next();
    })
    .catch((err) => {
      console.warn('Firebase token verification failed:', err?.message || err);
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    });
}

module.exports = {
  authMiddleware,
  isAllowedOrigin,
};
