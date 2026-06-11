const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('./dbServerless');
const { ObjectId } = require('mongodb');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'smmsecure-access-secret-please-change';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'smmsecure-refresh-secret-please-change';
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES || '30d';
const REFRESH_TOKEN_COOKIE_NAME = 'smmsecure_refresh_token';
const REFRESH_TOKEN_EXPIRES_MS = Number(process.env.JWT_REFRESH_TOKEN_MAX_AGE_MS || 30 * 24 * 60 * 60 * 1000);
const BCRYPT_SALT_ROUNDS = Number(process.env.ADMIN_BCRYPT_SALT_ROUNDS || 12);
const MAX_LOGIN_ATTEMPTS = Number(process.env.ADMIN_MAX_LOGIN_ATTEMPTS || 6);
const LOCK_WINDOW_MS = Number(process.env.ADMIN_LOCK_WINDOW_MS || 15 * 60 * 1000);

function getRefreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'None',
    path: '/smmsecure/admin',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  };
}

async function hashValue(value) {
  return bcrypt.hash(value, BCRYPT_SALT_ROUNDS);
}

async function verifyHash(value, hash) {
  return bcrypt.compare(value, hash);
}

function generateAccessToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      type: 'access',
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

function generateRefreshToken(admin) {
  const tokenId = crypto.randomUUID();
  return {
    token: jwt.sign(
      {
        sub: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        type: 'refresh',
        jti: tokenId,
      },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    ),
    tokenId,
  };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
}

async function getAdminByEmail(email) {
  if (!email) return null;
  const db = getDB();
  return db.collection('admins').findOne({ email: email.toLowerCase().trim() });
}

async function getAdminById(id) {
  const db = getDB();
  try {
    return db.collection('admins').findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

async function seedSuperAdmin() {
  const db = getDB();
  const collection = db.collection('admins');

  await collection.createIndex({ email: 1 }, { unique: true });

  const email = (process.env.ADMIN_SEED_EMAIL || 'alaudinf92@gmail.com').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || 'Alauddinnn@smmsecure';
  const existing = await collection.findOne({ email });
  if (existing) {
    return;
  }

  const passwordHash = await hashValue(password);
  await collection.insertOne({
    name: 'Super Admin',
    email,
    passwordHash,
    role: 'super_admin',
    status: 'active',
    refreshTokens: [],
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function getRefreshCookieName() {
  return REFRESH_TOKEN_COOKIE_NAME;
}

module.exports = {
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  getRefreshCookieName,
  getRefreshCookieOptions,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashValue,
  verifyHash,
  getAdminByEmail,
  getAdminById,
  seedSuperAdmin,
  MAX_LOGIN_ATTEMPTS,
  LOCK_WINDOW_MS,
};
