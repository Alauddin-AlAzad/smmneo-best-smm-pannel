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
    res.status(500).json({ success: false, message: 'Failed to update provider' });
  }
});

// DELETE provider
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require('mongodb');
    const providerId = new ObjectId(req.params.id);
    const providerToDelete = await db.collection('providers').findOne({ _id: providerId });

    if (!providerToDelete) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const result = await db.collection('providers').deleteOne({ _id: providerId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const settingsCollection = db.collection('settings');
    const globalSettings = await settingsCollection.findOne({ _id: 'global' });
    const activeProvider = globalSettings?.provider;

    const activeProviderId = activeProvider?._id?.toString?.() || activeProvider?._id;
    const deletedProviderId = providerToDelete._id.toString();
    const activeProviderMatchesDeleted =
      (activeProviderId && activeProviderId === deletedProviderId) ||
      (activeProvider?.apiUrl && activeProvider.apiUrl === providerToDelete.apiUrl);

    if (activeProviderMatchesDeleted) {
      const fallbackProvider = await db.collection('providers').findOne({});

      if (fallbackProvider) {
        await settingsCollection.updateOne(
          { _id: 'global' },
          { $set: { provider: fallbackProvider, updatedAt: new Date() } },
          { upsert: true }
        );
      } else {
        await settingsCollection.updateOne(
          { _id: 'global' },
          { $unset: { provider: '' }, $set: { updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }

    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete provider' });
  }
});

module.exports = router;
