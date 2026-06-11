const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

// Build connection URI
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

// Global connection object for serverless reuse
let cachedClient = null;
let cachedDB = null;
// Promise that represents an in-progress connection attempt to avoid races
let connectPromise = null;

/**
 * Connect to MongoDB with pooling for serverless functions
 * Reuses connection across function invocations on Vercel
 */
async function connectDB() {
  // If DB is already connected and healthy, return it
  if (cachedDB && cachedClient) {
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return cachedDB;
    } catch (err) {
      console.warn('⚠️ Cached connection unhealthy, reconnecting...', err.message);
      try {
        await cachedClient.close();
      } catch (e) {
        // ignore close error
      }
      cachedClient = null;
      cachedDB = null;
    }
  }

  // If a connection attempt is already in progress, wait for it
  if (connectPromise) {
    return connectPromise;
  }

  // Start a new connection attempt and cache the promise
  connectPromise = (async () => {
    try {
      console.log('🔌 Connecting to MongoDB...');
      const clientOptions = {
      // Connection pool settings for serverless (key for Vercel!)
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) : 10,
      minPoolSize: process.env.MONGO_MIN_POOL_SIZE ? parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) : 2,
      
      // Timeout settings
      serverSelectionTimeoutMS: process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS ? parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) : 30000,
      connectTimeoutMS: process.env.MONGO_CONNECT_TIMEOUT_MS ? parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) : 30000,
      socketTimeoutMS: process.env.MONGO_SOCKET_TIMEOUT_MS ? parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) : 45000,
      
      // Connection and write settings
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      
      // Monitoring
      monitorCommands: false,
      
      // Allow SRV record discovery (for mongodb+srv URIs)
      directConnection: false,
    };

    // Increase timeouts for serverless environments
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log('📍 Serverless environment detected - adjusting timeouts');
      clientOptions.serverSelectionTimeoutMS = 45000;
      clientOptions.connectTimeoutMS = 45000;
    }

    cachedClient = new MongoClient(MONGO_URI, clientOptions);

    // Set event listeners for debugging
    cachedClient.on('serverDescriptionChanged', () => {
      console.log('🔄 Server topology changed');
    });

    cachedClient.on('error', (err) => {
      console.error('❌ MongoDB Client Error:', err.message);
      cachedClient = null;
      cachedDB = null;
    });

    // Attempt connection with retry logic
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        await cachedClient.connect();
        console.log('✅ Connected to MongoDB Atlas');
        break;
      } catch (err) {
        lastError = err;
        retries -= 1;
        if (retries > 0) {
          console.log(`⏳ Retrying connection... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (retries === 0 && lastError) {
      throw new Error(`Failed to connect after 3 attempts: ${lastError.message}`);
    }

    cachedDB = cachedClient.db(DB_NAME);

    // Verify database is accessible
    await cachedClient.db('admin').command({ ping: 1 });
    console.log('✅ Database connectivity verified');
    return cachedDB;
  } catch (err) {
    console.error('❌ MongoDB connection init failed:', err.message);
    cachedClient = null;
    cachedDB = null;
    throw err;
  }
  })();

  try {
    const result = await connectPromise;
    return result;
  } catch (err) {
    // Clear promise and cached clients on failure
    connectPromise = null;
    cachedClient = null;
    cachedDB = null;
    console.error('❌ Initial DB connection failed:', err.message);
    throw new Error(`MongoDB connection failed: ${err.message}`);
  } finally {
    connectPromise = null;
  }
}

/**
 * Get database instance (assumes connectDB was called first)
 * For use in route handlers and middleware
 */
function getDB() {
  if (!cachedDB) {
    throw new Error('Database not connected - call connectDB() first');
  }
  return cachedDB;
}

/**
 * Close database connection
 * Use in cleanup/shutdown scenarios only
 */
async function closeDB() {
  if (cachedClient) {
    try {
      await cachedClient.close();
      console.log('✅ MongoDB connection closed');
    } catch (err) {
      console.error('❌ Error closing connection:', err.message);
    } finally {
      cachedClient = null;
      cachedDB = null;
    }
  }
}

module.exports = { connectDB, getDB, closeDB };
