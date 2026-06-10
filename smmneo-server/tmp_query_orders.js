const { connectDB } = require('./db');
(async () => {
  try {
    const db = await connectDB();
    const ids = ['91327238','91326697'];
    const docs = await db.collection('orders').find({ $or: [ { providerOrderId: { $in: ids } }, { externalId: { $in: ids } }, { orderId: { $in: ids } }, { 'providerResponse.order': { $in: ids } }, { 'providerResponse.id': { $in: ids } } ] }).toArray();  } catch (err) {  } finally {
    process.exit(0);
  }
})();
