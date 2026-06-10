const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://127.0.0.1:27017', {serverSelectionTimeoutMS: 5000});

(async () => {
  try {
    await client.connect();
    const db = client.db('smmneo');
    
    console.log('\n✓ Connected to MongoDB\n');
    
    // Check both orders
    const order1 = await db.collection('orders').findOne({providerOrderId: '91285190'});
    const order2 = await db.collection('orders').findOne({providerOrderId: '91297263'});
    
    console.log('=== Order 91285190 ===');
    if (order1) {
      console.log('Status:', order1.status);
      console.log('Provider Status:', order1.providerStatus || 'N/A');
      console.log('Raw Provider Status:', order1.rawProviderStatus || 'N/A');
    } else {
      console.log('NOT FOUND');
    }
    
    console.log('\n=== Order 91297263 ===');
    if (order2) {
      console.log('Status:', order2.status);
      console.log('Provider Status:', order2.providerStatus || 'N/A');
      console.log('Raw Provider Status:', order2.rawProviderStatus || 'N/A');
    } else {
      console.log('NOT FOUND');
    }
    
  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await client.close();
  }
})();
