const express = require('express');
const { getDB } = require('../db.js');

const router = express.Router();

// GET all providers
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const providers = await db.collection('providers').find({}).toArray();
    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch providers' });
  }
});

// GET single provider
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require('mongodb');
    const provider = await db.collection('providers').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider' });
  }
});

// POST create new provider
router.post('/', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ success: false, message: 'API URL and Key are required' });
    }

    const db = getDB();
    const provider = {
      name: name || new URL(apiUrl).hostname,
      apiUrl,
      apiKey,
      disableSync: disableSync || false,
      loginUsername: loginUsername || '',
      loginPassword: loginPassword || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('providers').insertOne(provider);
    res.json({ success: true, data: { ...provider, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ success: false, message: 'Failed to create provider' });
  }
});

// PUT update provider
router.put('/:id', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword } = req.body;
    const { ObjectId } = require('mongodb');
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ success: false, message: 'API URL and Key are required' });
    }

    const db = getDB();
    const updateData = {
      name: name || new URL(apiUrl).hostname,
      apiUrl,
      apiKey,
      disableSync: disableSync || false,
      loginUsername: loginUsername || '',
      loginPassword: loginPassword || '',
      updatedAt: new Date(),
    };

    const result = await db.collection('providers').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    res.json({ success: true, data: { ...updateData, _id: req.params.id } });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ success: false, message: 'Failed to update provider' });
  }
});

// DELETE provider
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require('mongodb');
    
    const result = await db.collection('providers').deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ success: false, message: 'Failed to delete provider' });
  }
});

module.exports = router;
