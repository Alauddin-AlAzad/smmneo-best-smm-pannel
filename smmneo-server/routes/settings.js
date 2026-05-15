const express = require('express');
const router = express.Router();
const { getDB } = require('../db.js');

// GET /api/settings - return global settings (single doc)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    res.json({ success: true, data: doc || {} });
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// POST /api/settings - upsert global settings
router.post('/', async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider || !provider.apiUrl) {
      return res.status(400).json({ success: false, error: 'provider.apiUrl required' });
    }

    const db = getDB();
    const col = db.collection('settings');
    const update = { $set: { provider, updatedAt: new Date() } };
    await col.updateOne({ _id: 'global' }, update, { upsert: true });
    const doc = await col.findOne({ _id: 'global' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

module.exports = router;
