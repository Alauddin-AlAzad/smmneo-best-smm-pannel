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

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;
  
  // Configuration to work around Node.js DNS issues
  const clientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    retryWrites: true,
  };
  
  // If using SRV, add DNS settings
  if (MONGO_URI.includes('mongodb+srv')) {
    clientOptions.directConnection = false; // Allow SRV discovery
  }
  
  client = new MongoClient(MONGO_URI, clientOptions);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not connected');
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectDB, getDB, closeDB };
