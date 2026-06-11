const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || (() => {
  const user = process.env.DB_USER || '';
  const pass = process.env.DB_PASS || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '27017';
  if (user && pass && host.includes('mongodb.net')) {
    return `mongodb+srv://${user}:${pass}@${host}/?retryWrites=true&w=majority`;
  }
  if (user && pass) return `mongodb://${user}:${pass}@${host}:${port}/`;
  return `mongodb://${host}:${port}/`;
})();

const DB_NAME = process.env.DB_NAME || 'smmneo';

let cachedClient = null;
let cachedDB = null;
let connectPromise = null;

async function connectDB() {
  if (cachedDB && cachedClient) {
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return cachedDB;
    } catch (err) {
      cachedClient = null;
      cachedDB = null;
    }
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const clientOptions = {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) : 10,
      minPoolSize: process.env.MONGO_MIN_POOL_SIZE ? parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) : 2,
      serverSelectionTimeoutMS: process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS ? parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) : 30000,
      connectTimeoutMS: process.env.MONGO_CONNECT_TIMEOUT_MS ? parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) : 30000,
      socketTimeoutMS: process.env.MONGO_SOCKET_TIMEOUT_MS ? parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) : 45000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
    };

    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      clientOptions.serverSelectionTimeoutMS = 45000;
      clientOptions.connectTimeoutMS = 45000;
    }

    const client = new MongoClient(MONGO_URI, clientOptions);
    client.on('error', (err) => {
      console.error('MongoDB client error:', err.message);
      cachedClient = null;
      cachedDB = null;
    });

    await client.connect();
    const db = client.db(DB_NAME);
    await client.db('admin').command({ ping: 1 });

    cachedClient = client;
    cachedDB = db;
    return db;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

function getDB() {
  if (!cachedDB) {
    throw new Error('Database not connected');
  }
  return cachedDB;
}

module.exports = { connectDB, getDB };
