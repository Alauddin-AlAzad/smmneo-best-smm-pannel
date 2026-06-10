const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017', {serverSelectionTimeoutMS: 5000});
(async () => {
  try {
    await client.connect();
    const db = client.db('smmneo');
    
    // Search for the order
    const order = await db.collection('orders').findOne({orderId: '91317820'});
    
    if (order) {      // Update status to completed
      await db.collection('orders').updateOne(
        {_id: order._id},
        {$set: {status: 'completed', updatedAt: new Date()}}
      );    } else {    }
  } finally { await client.close(); }
})();
