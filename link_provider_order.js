const { MongoClient } = require('mongodb');
require('dotenv').config();

(async () => {
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
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const orders = db.collection('orders');

    const localOrderId = '01300904';
    const providerOrderId = '90325186';

    const order = await orders.findOne({ orderId: localOrderId });
    if (!order) {
      console.log('Local order not found for', localOrderId);
      process.exit(1);
    }

    await orders.updateOne({ _id: order._id }, { $set: { providerOrderId: providerOrderId, externalId: providerOrderId, updatedAt: new Date() } });
    console.log('Linked local order', localOrderId, 'to providerOrderId', providerOrderId);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  } finally {
    await client.close();
  }
})();
