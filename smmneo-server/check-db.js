const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://127.0.0.1:27017', {serverSelectionTimeoutMS: 5000});

(async () => {
  try {
    await client.connect();
    const db = client.db('smmneo');    // Check both orders
    const order1 = await db.collection('orders').findOne({providerOrderId: '91285190'});
    const order2 = await db.collection('orders').findOne({providerOrderId: '91297263'});    if (order1) {    } else {    }    if (order2) {    } else {    }
    
  } catch (err) {  } finally {
    await client.close();
  }
})();
