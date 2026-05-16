const express = require('express');
const dotenv = require('dotenv');
const { connectDB, getDB } = require('./db.js');
const { ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Minimal CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Basic endpoints
app.get('/', (req, res) => {
  res.json({ message: 'SMMGen API Server (with settings)', version: '1.0.0', status: 'running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// ============ SETTINGS ROUTES ============
// GET /api/settings - return global settings (single doc)
app.get('/api/settings', async (req, res) => {
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
app.post('/api/settings', async (req, res) => {
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

// ============ PROVIDERS ROUTES ============
// GET all providers
app.get('/api/providers', async (req, res) => {
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
app.get('/api/providers/:id', async (req, res) => {
  try {
    const db = getDB();
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
app.post('/api/providers', async (req, res) => {
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
app.put('/api/providers/:id', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword } = req.body;
    
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
app.delete('/api/providers/:id', async (req, res) => {
  try {
    const db = getDB();
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
    console.error('Error deleting provider:', error);
    res.status(500).json({ success: false, message: 'Failed to delete provider' });
  }
});

// ============ PROVIDER PROXY ROUTES ============
// GET /api/provider/services - proxy to configured provider with PAGINATION
app.get('/api/provider/services', async (req, res) => {
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

    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)); // cap at 100, default 50

    const params = new URLSearchParams();
    if (apiKey) params.append('key', apiKey);
    params.append('action', 'services');

    console.log(`📤 Proxying to ${apiUrl} (page=${page}, limit=${limit})`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: params,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error(`Provider returned status ${response.status}`);
      return res.status(response.status).json({ success: false, error: 'Provider returned error' });
    }

    const data = await response.json();
    let allServices = Array.isArray(data) ? data : (data.data || []);

    if (!Array.isArray(allServices)) {
      console.error('Provider response is not an array');
      return res.status(500).json({ success: false, error: 'Invalid provider response format' });
    }

    // Apply pagination
    const total = allServices.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedServices = allServices.slice(start, end);

    console.log(`✅ Fetched ${total} services, returning ${paginatedServices.length} (page ${page}/${Math.ceil(total / limit)})`);

    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: end < total,
      },
    });
  } catch (err) {
    console.error('Provider proxy error:', err);
    res.status(500).json({ success: false, error: 'Failed to proxy to provider', message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server after DB connection
async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down');
      server.close(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
