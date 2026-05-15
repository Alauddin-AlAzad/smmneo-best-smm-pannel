const express = require('express');
const router = express.Router();
const { getDB } = require('../db.js');

// GET /api/provider/services - proxy to configured provider using saved settings
router.get('/services', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    const provider = doc?.provider;
    if (!provider || !provider.apiUrl) {
      return res.status(400).json({ success: false, error: 'No provider configured' });
    }

    const apiUrl = provider.apiUrl;
    const apiKey = provider.apiKey;

    const params = new URLSearchParams();
    if (apiKey) params.append('key', apiKey);
    params.append('action', 'services');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: params,
      headers: { Accept: 'application/json' },
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Provider proxy error:', err);
    res.status(500).json({ success: false, error: 'Failed to proxy to provider' });
  }
});

module.exports = router;
