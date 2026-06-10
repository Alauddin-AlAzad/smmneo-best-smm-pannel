const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://127.0.0.1:27017');

async function checkOrders() {
  try {
    await client.connect();
    const db = client.db('smmneo');
    
    console.log('=== Order 91285190 ===');
    const order1 = await db.collection('orders').findOne({providerOrderId: '91285190'});
    if (order1) {
      console.log('Status:', order1.status);
      console.log('Provider Status:', order1.providerStatus);
      console.log('Raw Provider Status:', order1.rawProviderStatus);
      console.log('Full data:', JSON.stringify(order1, null, 2));
    } else {
      console.log('Order not found!');
    }
    
    console.log('\n=== Order 91297263 ===');
    const order2 = await db.collection('orders').findOne({providerOrderId: '91297263'});
    if (order2) {
      console.log('Status:', order2.status);
      console.log('Provider Status:', order2.providerStatus);
      console.log('Raw Provider Status:', order2.rawProviderStatus);
      console.log('Full data:', JSON.stringify(order2, null, 2));
    } else {
      console.log('Order not found!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

checkOrders();
