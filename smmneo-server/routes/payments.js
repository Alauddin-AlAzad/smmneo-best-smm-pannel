const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// POST /api/payments/submit
router.post('/submit', async (req, res) => {
  try {
    const db = getDB();
    const { method, senderNumber, transactionId, amount, screenshotBase64, userId } = req.body || {};
    if (!method || !senderNumber || !transactionId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Prevent duplicate transaction IDs
    const col = db.collection('paymentRequests');
    const existing = await col.findOne({ transactionId: { $regex: `^${transactionId}$`, $options: 'i' } });
    if (existing) return res.status(409).json({ success: false, error: 'Duplicate transaction ID' });

    const doc = {
      method, senderNumber, transactionId, amount: Number(amount), userId: userId || null,
      status: 'pending', createdAt: new Date(), updatedAt: new Date(), adminNotes: '',
    };

    // Save screenshot if provided (base64) to uploads/payments
    if (screenshotBase64) {
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(process.cwd(), 'uploads', 'payments');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const buf = Buffer.from(screenshotBase64, 'base64');
        const filename = `payment-${Date.now()}.jpg`;
        const full = path.join(uploadsDir, filename);
        fs.writeFileSync(full, buf);
        doc.screenshot = `/uploads/payments/${filename}`;
      } catch (err) {
        // Failed to save screenshot, continuing
      }
    }

    const result = await col.insertOne(doc);
    res.json({ success: true, data: { id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to submit' });
  }
});

// GET /api/payments - admin list
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentRequests');
    const q = {};
    if (req.query.q) q.$or = [{ transactionId: { $regex: req.query.q, $options: 'i' } }, { senderNumber: { $regex: req.query.q, $options: 'i' } }];
    const docs = await col.find(q).sort({ createdAt: -1 }).limit(200).toArray();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list' });
  }
});

// GET /api/payments/numbers - list saved payment numbers (admin)
router.get('/numbers', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentNumbers');
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list' });
  }
});

// POST /api/payments/numbers - add or update a payment number (admin)
router.post('/numbers', async (req, res) => {
  try {
    const db = getDB();
    const { key, label, number, logo, meta } = req.body || {};
    if (!key || !number) {
      return res.status(400).json({ success: false, error: 'key and number required' });
    }
    const col = db.collection('paymentNumbers');
    const result = await col.updateOne({ key }, { $set: { key, label: label || key, number, logo: logo || '', meta: meta || {}, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

// POST /api/payments/:id/verify - admin verify
router.post('/:id/verify', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentRequests');
    const id = req.params.id;
    const { status, adminNotes } = req.body || {};
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const { ObjectId } = require('mongodb');
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    await col.updateOne({ _id: doc._id }, { $set: { status, adminNotes: adminNotes || '', updatedAt: new Date() } });

    // If approved and userId present, credit user's wallet
    if (status === 'approved' && doc.userId) {
      const users = db.collection('users');
      const amt = Number(doc.amount) || 0;
      if (amt) {
        await users.updateOne({ _id: doc.userId }, { $inc: { balanceUSD: amt }, $set: { updatedAt: new Date() } });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to verify' });
  }
});

// GET /api/payment-settings - return bkash/nagad/rocket settings
router.get('/payment-settings', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentSettings');
    // single document with _id: 'global' or separate docs per key
    const doc = await col.findOne({ _id: 'global' });
    if (doc && doc.methods) return res.json({ success: true, data: doc.methods });

    // fallback: build from individual docs
    const rows = await col.find({}).toArray();
    if (rows && rows.length) {
      const data = {};
      for (const r of rows) {
        const k = r.key || r._id || r.method;
        data[k] = { number: r.number || '', accountType: r.accountType || r.accountType || 'Personal', instruction: r.instruction || '' };
      }
      return res.json({ success: true, data });
    }

    return res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// POST /api/payment-settings - save payment settings (admin)
router.post('/payment-settings', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentSettings');
    const incoming = req.body || {};
    // Save as single global doc for simplicity
    const methods = {
      bkash: incoming.bkash || {},
      nagad: incoming.nagad || {},
      rocket: incoming.rocket || {},
    };
    await col.updateOne({ _id: 'global' }, { $set: { methods, updatedAt: new Date() } }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

// POST /api/add-fund-request - submit fund request
router.post('/add-fund-request', async (req, res) => {
  try {
    const db = getDB();
    const { paymentMethod, amount, paymentNumber, clientNumber, transactionId, userId } = req.body || {};
    if (!paymentMethod || !amount || !paymentNumber || !clientNumber || !transactionId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const username = typeof req.body.username === 'string' ? req.body.username.trim() : null;
    const normalizedUsername = username ? username.replace(/\s+/g, '_').replace(/@.*$/, '').toLowerCase() : null;

    const trimmedTransactionId = String(transactionId).trim();
    if (!trimmedTransactionId) {
      return res.status(400).json({ success: false, error: 'Transaction ID cannot be empty' });
    }

    const col = db.collection('fund_requests');
    const existing = await col.findOne({ transaction_id: trimmedTransactionId });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This transaction ID has already been submitted' });
    }

    const doc = {
      payment_method: paymentMethod,
      amount: Number(amount),
      payment_number: paymentNumber,
      client_number: clientNumber,
      transaction_id: trimmedTransactionId,
      user_id: userId || null,
      username: normalizedUsername || null,
      status: 'pending',
      created_at: new Date(),
    };
    const result = await col.insertOne(doc);
    res.json({ success: true, data: { id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

module.exports = router;
