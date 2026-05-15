const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./db.js');
const settingsRouter = require('./routes/settings.js');
const providerProxyRouter = require('./routes/provider-proxy.js');
const providersRouter = require('./routes/providers.js');

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

// API routes
app.use('/api/settings', settingsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/provider', providerProxyRouter);

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
      console.log(`Server running on http://0.0.0.0:${PORT}`);
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
