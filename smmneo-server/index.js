const express = require('express');
const dotenv = require('dotenv');
const { connectDB, getDB } = require('./db.js');
const { ObjectId } = require('mongodb');

const firebaseAdmin = require('firebase-admin');
let firebaseFirestore = null;
try {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault(),
  });
  firebaseFirestore = firebaseAdmin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (firebaseInitError) {
  console.warn('⚠️ Firebase Admin initialization failed:', firebaseInitError.message);
}

async function updateFirestoreUserBalance(firebaseUid, usdAmount) {
  if (!firebaseFirestore || !firebaseUid || typeof usdAmount !== 'number' || usdAmount <= 0) {
    return;
  }
  try {
    const userRef = firebaseFirestore.doc(`users/${firebaseUid}`);
    await userRef.set(
      {
        balanceUSD: firebaseAdmin.firestore.FieldValue.increment(usdAmount),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating Firestore user balance:', err);
  }
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const providerServicesCache = {
  providerKey: null,
  fetchedAt: 0,
  services: [],
};

const PROVIDER_SERVICES_CACHE_TTL_MS = 5 * 60 * 1000;

const ADMIN_LIST_LIMIT = 50;

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDateValue(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function formatDateTimeValue(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function formatOrderAmount(value, currency = 'USD') {
  const amount = Number(value) || 0;
  if (String(currency).toUpperCase() === 'BDT') {
    return `BDT ${amount.toFixed(2)}`;
  }
  const absAmount = Math.abs(amount);
  if (absAmount >= 0.01) {
    return `$${amount.toFixed(2)}`;
  }
  if (absAmount > 0) {
    return `$${amount.toFixed(8).replace(/\.0+$|([0-9]*\.[0-9]*?)0+$/, '$1')}`;
  }
  return `$${amount.toFixed(2)}`;
}

function createKeywordQuery(keyword) {
  const fields = ['type', 'orderType', 'mode', 'category', 'service', 'serviceType', 'name', 'label', 'subject'];
  return {
    $or: fields.map((field) => ({ [field]: { $regex: keyword, $options: 'i' } })),
  };
}

function normalizeStatus(value, fallback = 'pending') {
  if (!value) return fallback;
  const status = String(value).trim().toLowerCase();
  if (!status) return fallback;
  return status;
}

function normalizeUsername(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const atIndex = trimmed.indexOf('@');
  if (atIndex > 0) {
    return trimmed.slice(0, atIndex);
  }
  const lower = trimmed.toLowerCase();
  const domainPattern = /_(gmail|yahoo|outlook|hotmail|icloud|aol|protonmail|live|msn|ymail|googlemail)\.com$/i;
  if (domainPattern.test(lower)) {
    return trimmed.replace(domainPattern, '');
  }
  return trimmed;
}

function mapUserRow(doc) {
  const email = pickFirstString(doc.email, doc.loginEmail, doc.username);
  // Prioritize: displayName > name > generate from email
  const displayName = pickFirstString(doc.displayName, doc.name);
  const nameFromEmail = email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'User';
  const name = displayName || nameFromEmail || 'User';
  const status = normalizeStatus(doc.status, doc.disabled ? 'inactive' : 'active');

  return {
    id: doc._id?.toString?.() || doc.id || name,
    name,
    email,
    status,
    joinDate: formatDateValue(doc.createdAt || doc.joinDate || doc.updatedAt),
    balanceUSD: parseFloat(doc.balanceUSD || 0),
    totalOrders: parseInt(doc.totalOrders || 0),
    totalSpent: parseFloat(doc.totalSpent || 0),
  };
}

function mapOrderRow(doc) {
  const providerOrderId = pickFirstString(
    doc.providerOrderId?.toString?.(),
    doc.externalId?.toString?.(),
    doc.orderId?.toString?.(),
    doc.order_id?.toString?.(),
    doc.id?.toString?.()
  );
  const orderId = providerOrderId || pickFirstString(doc.orderId, doc.order_id, doc.id, doc.externalId) || `ORD-${String(doc._id || '').slice(-6)}`;
  const customer = pickFirstString(doc.customer, doc.userName, doc.name, doc.email, 'Customer');
  const service = pickFirstString(doc.service, doc.serviceName, doc.name, doc.category, 'Service');
  const amountRaw = toNumber(doc.amount ?? doc.price ?? doc.total ?? doc.paidAmount);
  const currency = pickFirstString(doc.currency, 'USD').toUpperCase();

  return {
    id: doc._id?.toString?.() || orderId,
    orderId,
    providerOrderId,
    customer,
    service,
    amount: formatOrderAmount(amountRaw, currency),
    amountRaw,
    currency,
    status: normalizeStatus(doc.status, 'pending'),
    date: formatDateValue(doc.createdAt || doc.date || doc.updatedAt),
  };
}

function mapUserOrderRow(doc) {
  const row = mapOrderRow(doc);
  const providerResponse = doc.providerResponse || {};
  const providerServiceId = pickFirstString(
    doc.providerServiceId?.toString?.(),
    doc.provider_service_id?.toString?.(),
    doc.serviceId?.toString?.(),
    providerResponse.serviceId?.toString?.(),
    providerResponse.service_id?.toString?.(),
    providerResponse.service?.toString?.()
  );

  return {
    ...row,
    providerServiceId,
    link: pickFirstString(doc.link, ''),
    quantity: parseInt(doc.quantity || 0, 10),
    startCount: parseInt(
      providerResponse.start ?? providerResponse.start_count ?? providerResponse.startCount ?? doc.startCount ?? doc.start_count ?? 0,
      10
    ),
    remains: parseInt(
      providerResponse.remains ?? providerResponse.remaining ?? providerResponse.remain ?? doc.remains ?? doc.remaining ?? doc.remain ?? 0,
      10
    ),
    providerResponse: providerResponse,
    cancelable: Boolean(doc.providerCancelable || doc.cancelable || doc.cancellable || false),
    refillable: Boolean(doc.providerRefillable || doc.refillable || false),
    providerStatus: pickFirstString(
      (providerResponse && (providerResponse.status || providerResponse.state)) || doc.providerStatus || doc.provider_state || doc.provider_state_text || ''
    ),
  };
}

function mapTicketRow(doc) {
  const ticketId = pickFirstString(doc.ticketId, doc.id, doc.subject) || `TKT-${String(doc._id || '').slice(-6)}`;
  const replies = Array.isArray(doc.replies) ? doc.replies : [];
  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
  const status = normalizeStatus(doc.status, 'pending');
  const unreadForUser = Number.isFinite(Number(doc.unreadForUser))
    ? Math.max(0, Number(doc.unreadForUser))
    : (lastReply?.authorType === 'admin' ? 1 : 0);
  const unreadForAdmin = Number.isFinite(Number(doc.unreadForAdmin))
    ? Math.max(0, Number(doc.unreadForAdmin))
    : (lastReply?.authorType === 'user' ? 1 : 0);
  return {
    id: doc._id?.toString?.() || ticketId,
    ticketId,
    email: pickFirstString(doc.email, doc.userEmail, doc.loginEmail),
    name: pickFirstString(doc.name, doc.userName, doc.displayName),
    category: pickFirstString(doc.category, doc.type, 'Support'),
    subcategory: pickFirstString(doc.subcategory, doc.subCategory, doc.issueType, ''),
    subject: pickFirstString(doc.subject, doc.message, doc.title, 'Support Request'),
    message: pickFirstString(doc.message, doc.description, ''),
    status: status === 'open' ? 'pending' : status,
    priority: normalizeStatus(doc.priority, 'medium'),
    date: formatDateValue(doc.createdAt || doc.date || doc.updatedAt),
    updatedAt: formatDateTimeValue(doc.updatedAt || doc.createdAt || doc.date),
    repliesCount: replies.length,
    lastReplyAt: formatDateTimeValue(lastReply?.createdAt || lastReply?.date || lastReply?.updatedAt),
    lastReplyAuthorType: normalizeStatus(lastReply?.authorType, 'user'),
    unreadForUser,
    unreadForAdmin,
  };
}

function mapTicketReplyRow(doc, index = 0) {
  return {
    id: doc.id || `${doc.authorType || 'reply'}-${index}`,
    authorType: normalizeStatus(doc.authorType, 'user'),
    authorName: pickFirstString(doc.authorName, doc.name, doc.email, 'Support'),
    authorEmail: pickFirstString(doc.authorEmail, doc.email),
    message: pickFirstString(doc.message, ''),
    date: formatDateTimeValue(doc.createdAt || doc.date || doc.updatedAt),
  };
}

function mapTicketThread(doc) {
  const row = mapTicketRow(doc);
  return {
    ...row,
    replies: [
      {
        id: `${row.id}-message`,
        authorType: 'user',
        authorName: row.name || row.email || 'User',
        authorEmail: row.email,
        message: row.message,
        date: row.updatedAt,
      },
      ...(Array.isArray(doc.replies) ? doc.replies : []).map(mapTicketReplyRow),
    ].filter((reply) => reply.message),
  };
}

async function findTicketByTicketId(db, ticketId) {
  return db.collection('tickets').findOne({ ticketId: { $regex: `^${ticketId}$`, $options: 'i' } });
}

async function appendTicketReply(db, ticketDoc, reply, nextStatus) {
  const replies = Array.isArray(ticketDoc.replies) ? ticketDoc.replies : [];
  const updatedTicket = {
    ...reply,
    createdAt: reply.createdAt || new Date(),
  };
  const authorType = normalizeStatus(reply.authorType, 'user');
  const unreadForUser = authorType === 'admin' ? Math.max(0, Number(ticketDoc.unreadForUser || 0) + 1) : 0;
  const unreadForAdmin = authorType === 'user' ? Math.max(0, Number(ticketDoc.unreadForAdmin || 0) + 1) : 0;

  await db.collection('tickets').updateOne(
    { _id: ticketDoc._id },
    {
      $push: { replies: updatedTicket },
      $set: {
        status: nextStatus,
        updatedAt: new Date(),
        replyCount: replies.length + 1,
        unreadForUser,
        unreadForAdmin,
        lastReplyAuthorType: authorType,
      },
    }
  );

  return updatedTicket;
}

async function markTicketReadForViewer(db, ticketDoc, viewer) {
  const role = normalizeStatus(viewer, '');

  if (role !== 'user' && role !== 'admin') {
    return ticketDoc;
  }

  const update = { updatedAt: new Date() };
  if (role === 'user') update.unreadForUser = 0;
  if (role === 'admin') update.unreadForAdmin = 0;

  await db.collection('tickets').updateOne({ _id: ticketDoc._id }, { $set: update });
  return db.collection('tickets').findOne({ _id: ticketDoc._id });
}

async function fetchAdminOverviewData(db) {
  const usersCol = db.collection('users');
  const ordersCol = db.collection('orders');
  const servicesCol = db.collection('services');
  const ticketsCol = db.collection('tickets');

  const [
    totalMembers,
    ordersReceived,
    refillOrders,
    resellerOrders,
    manualOrders,
    services,
    unreadTickets,
    orders,
  ] = await Promise.all([
    usersCol.countDocuments({}),
    ordersCol.countDocuments({}),
    ordersCol.countDocuments(createKeywordQuery('refill')),
    ordersCol.countDocuments(createKeywordQuery('reseller')),
    ordersCol.countDocuments(createKeywordQuery('manual')),
    servicesCol.countDocuments({}),
    ticketsCol.countDocuments({
      $or: [
        { status: { $regex: 'open|pending|unread', $options: 'i' } },
        { read: false },
        { seen: false },
      ],
    }),
    ordersCol.find({}, { projection: { amount: 1, price: 1, total: 1, paidAmount: 1 } }).limit(1000).toArray(),
  ]);

  const payments = orders.reduce((sum, doc) => sum + toNumber(doc.amount ?? doc.price ?? doc.total ?? doc.paidAmount), 0);

  return {
    stats: [
      {
        id: 1,
        title: 'Total Members',
        count: totalMembers.toLocaleString(),
        icon: '👥',
        color: 'bg-blue-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 2,
        title: 'Orders Received',
        count: ordersReceived.toLocaleString(),
        icon: '📦',
        color: 'bg-purple-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 3,
        title: 'Refill Orders',
        count: refillOrders.toLocaleString(),
        icon: '🔄',
        color: 'bg-green-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 4,
        title: 'Reseller Orders',
        count: resellerOrders.toLocaleString(),
        icon: '🏪',
        color: 'bg-orange-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 5,
        title: 'Manual Orders',
        count: manualOrders.toLocaleString(),
        icon: '✏️',
        color: 'bg-pink-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 6,
        title: 'Services',
        count: services.toLocaleString(),
        icon: '🛠️',
        color: 'bg-cyan-100',
        trend: 'Live',
        trendUp: true,
      },
      {
        id: 7,
        title: 'Unread Tickets',
        count: unreadTickets.toLocaleString(),
        icon: '🎫',
        color: 'bg-red-100',
        trend: 'Live',
        trendUp: false,
      },
      {
        id: 8,
        title: 'Payments',
        count: `$${payments.toFixed(2)}`,
        icon: '💰',
        color: 'bg-yellow-100',
        trend: 'Live',
        trendUp: true,
      },
    ],
  };
}

// ---------------- Provider orders sync ----------------
async function fetchProviderOrdersFromApi(provider, orderId = null) {
  if (!provider || !provider.apiUrl) return [];

  try {
    const params = new URLSearchParams();
    if (provider.apiKey) params.append('key', provider.apiKey);

    // If a single order id is requested, prefer 'status' action which some providers use
    if (orderId) {
      params.append('action', 'status');
      params.append('order', String(orderId));
      const resp = await fetch(provider.apiUrl, { method: 'POST', body: params, headers: { Accept: 'application/json' } });
      if (resp.ok) {
        const json = await resp.json().catch(async () => { const t = await resp.text().catch(() => ''); return { rawText: t }; });
        // provider returned single order status object
        return [json];
      }
      // fall through to try 'orders' action below
    }

    // common provider action name for orders; providers vary so tolerate multiple shapes
    const paramsList = new URLSearchParams();
    if (provider.apiKey) paramsList.append('key', provider.apiKey);
    paramsList.append('action', 'orders');
    if (orderId) paramsList.append('order', String(orderId));

    const resp = await fetch(provider.apiUrl, { method: 'POST', body: paramsList, headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      console.error('Provider orders fetch failed:', resp.status);
      return [];
    }
    const json = await resp.json();
    // provider may return array or object with data
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.orders)) return json.orders;
    // Some providers wrap single order in object
    if (json && typeof json === 'object' && (json.order || json.id || json.data)) {
      // try to normalize into an array
      const maybe = json.order || json.data || json;
      if (Array.isArray(maybe)) return maybe;
      return [maybe];
    }
    return [];
  } catch (err) {
    console.error('Error fetching provider orders:', err);
    return [];
  }
}

async function reconcileProviderOrders(db, provider, providerOrders) {
  const ordersCol = db.collection('orders');
  let updated = 0;
  let inserted = 0;

  for (const prow of providerOrders) {
    try {
      // provider order identifier candidates
      const providerOrderId = (prow.id || prow.order || prow.order_id || prow.orderId || prow.externalId || prow.key || '').toString();
      if (!providerOrderId) continue;

      // search by provider id fields or matching external id
      const query = {
        $or: [
          { orderId: providerOrderId },
          { externalId: providerOrderId },
          { providerOrderId: providerOrderId },
        ],
      };

      const existing = await ordersCol.findOne(query);

      const mapped = {
        orderId: providerOrderId,
        externalId: providerOrderId,
        service: prow.service || prow.serviceName || prow.name || prow.service_id || prow.srv || '',
        providerCancelable: Boolean(prow.cancel || prow.cancellable || prow.cancelable || prow.can_cancel || false),
        providerRefillable: Boolean(prow.refill || prow.refillable || prow.can_refill || false),
        amount: Number(prow.amount ?? prow.price ?? prow.total ?? 0) || 0,
        status: (prow.status || prow.state || 'pending').toString(),
        startCount: Number(prow.start || prow.start_count || prow.startCount || 0) || 0,
        remains: Number(prow.remains || prow.remaining || prow.remain || 0) || 0,
        provider: { _id: provider._id?.toString?.() || provider._id || null, name: provider.name || provider.apiUrl },
        updatedAt: new Date(),
      };

      if (existing) {
        // update fields that may have changed
        await ordersCol.updateOne({ _id: existing._id }, { $set: mapped });
        updated++;
      } else {
        const toInsert = {
          ...mapped,
          createdAt: new Date(),
          syncedFromProvider: true,
        };
        await ordersCol.insertOne(toInsert);
        inserted++;
      }
    } catch (err) {
      console.error('Error reconciling provider order:', err);
    }
  }

  return { inserted, updated, total: providerOrders.length };
}

async function runSyncForProvider(provider) {
  try {
    const db = getDB();
    if (!provider || provider.disableSync) return { skipped: true };
    console.log('🔁 Starting sync for provider:', provider.name || provider.apiUrl);
    const providerOrders = await fetchProviderOrdersFromApi(provider);
    const result = await reconcileProviderOrders(db, provider, providerOrders || []);
    console.log(`🔁 Sync for ${provider.name || provider.apiUrl} completed. ${result.updated} updated, ${result.inserted} inserted.`);
    return result;
  } catch (err) {
    console.error('Error running sync for provider:', err);
    return { error: String(err) };
  }
}

// Push a single order to provider API
async function pushOrderToProvider(provider, orderDoc) {
  try {
    if (!provider || !provider.apiUrl) return { error: 'No provider configured' };

    const params = new URLSearchParams();
    if (provider.apiKey) params.append('key', provider.apiKey);

    // common provider order action names: 'add', 'create', 'order'
    const action = provider.orderAction || provider.createAction || 'add';
    params.append('action', action);

    // provider expects service id; try common fields or extract numeric id from service name
    const svcCandidate = orderDoc.providerServiceId || orderDoc.provider_service_id || orderDoc.serviceId || orderDoc.service || '';
    let svcId = '';
    if (svcCandidate) {
      const s = String(svcCandidate).trim();
      const m = s.match(/(\d{3,})/); // find a run of digits (3+ digits)
      if (m) {
        svcId = m[1];
      } else if (/^\d+$/.test(s)) {
        svcId = s;
      } else {
        console.log('pushOrderToProvider: missing numeric service id candidate=', s);
        return { error: "Missing numeric provider service id. Add 'providerServiceId' to the order or use a numeric 'service' value.", raw: s };
      }
    }
    console.log('pushOrderToProvider: svcCandidate=', svcCandidate, 'svcId=', svcId);
    params.append('service', String(svcId));
    params.append('quantity', String(orderDoc.quantity || orderDoc.qty || orderDoc.count || 1));
    if (orderDoc.link) params.append('link', String(orderDoc.link));
    if (orderDoc.callbackUrl) params.append('callback', String(orderDoc.callbackUrl));

    const resp = await fetch(provider.apiUrl, { method: 'POST', body: params, headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { error: `Provider request failed: ${resp.status}`, raw: text };
    }
    const json = await resp.json().catch(async () => {
      const t = await resp.text().catch(() => '');
      return { rawText: t };
    });

    // Try to extract provider order id from known keys
    const providerOrderId = (json && (json.order || json.id || json.order_id || json.job || json.request_id || json.externalId)) || (json && json.data && (json.data.order || json.data.id)) || null;
    const status = (json && (json.status || json.state)) || 'processing';
    const providerCancelable = Boolean(json && (json.cancel || json.cancellable || json.cancelable || json.can_cancel));
    const providerRefillable = Boolean(json && (json.refill || json.refillable || json.can_refill));

    return { providerOrderId, status, providerCancelable, providerRefillable, raw: json };
  } catch (err) {
    return { error: String(err) };
  }
}

// Manual push endpoint: POST /api/orders/:orderId/push
app.post('/api/orders/:orderId/push', async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const order = await db.collection('orders').findOne({ orderId: orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const settings = await db.collection('settings').findOne({ _id: 'global' });
    const provider = settings?.provider;
    if (!provider) return res.status(400).json({ success: false, error: 'No provider configured' });

    const result = await pushOrderToProvider(provider, order);
    if (result && result.providerOrderId) {
      const updateFields = {
        providerOrderId: result.providerOrderId,
        externalId: result.providerOrderId,
        providerResponse: result.raw,
        status: result.status || 'processing',
        updatedAt: new Date(),
      };
      if (typeof result.providerCancelable !== 'undefined') updateFields.providerCancelable = Boolean(result.providerCancelable);
      if (typeof result.providerRefillable !== 'undefined') updateFields.providerRefillable = Boolean(result.providerRefillable);
      await db.collection('orders').updateOne({ _id: order._id }, { $set: updateFields });
      return res.json({ success: true, data: result });
    }

    if (result && result.error) {
      const updateFields = { providerError: result.error, providerResponse: result.raw || null, updatedAt: new Date() };
      if (typeof result.providerCancelable !== 'undefined') updateFields.providerCancelable = Boolean(result.providerCancelable);
      if (typeof result.providerRefillable !== 'undefined') updateFields.providerRefillable = Boolean(result.providerRefillable);
      await db.collection('orders').updateOne({ _id: order._id }, { $set: updateFields });
      return res.status(500).json({ success: false, error: result.error, data: result.raw || null });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in push endpoint:', err);
    res.status(500).json({ success: false, error: 'Failed to push order' });
  }
});

// POST /api/orders/:orderId/cancel - request cancellation locally and attempt provider cancel
app.post('/api/orders/:orderId/cancel', async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const order = await db.collection('orders').findOne({ orderId: orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // If order is not cancelable locally or by provider, reject
    const cancelable = Boolean(order.providerCancelable || order.cancelable || order.cancellable || false);
    if (!cancelable) {
      // Allow local cancel for pending orders as fallback
      if (!['pending', 'processing'].includes(String(order.status || '').toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Order is not cancelable' });
      }
    }

    const settings = await db.collection('settings').findOne({ _id: 'global' });
    const provider = settings?.provider;

    // Mark local order as cancellation requested
    const updateObj = { status: 'canceled', providerCancellationRequested: true, updatedAt: new Date() };
    await db.collection('orders').updateOne({ _id: order._id }, { $set: updateObj });

    // Attempt provider cancel if configured and providerOrderId exists
    if (provider && provider.apiUrl && order.providerOrderId) {
      try {
        const params = new URLSearchParams();
        if (provider.apiKey) params.append('key', provider.apiKey);
        params.append('action', provider.cancelAction || 'cancel');
        params.append('order', String(order.providerOrderId));

        const resp = await fetch(provider.apiUrl, { method: 'POST', body: params, headers: { Accept: 'application/json' } });
        const json = await resp.json().catch(async () => (await resp.text().catch(() => '')));
        await db.collection('orders').updateOne({ _id: order._id }, { $set: { providerCancelResponse: json, providerCanceledAt: new Date(), updatedAt: new Date() } });
        return res.json({ success: true, data: { canceled: true, providerResponse: json } });
      } catch (err) {
        console.error('Provider cancel failed:', err);
        return res.status(500).json({ success: false, error: 'Failed to cancel with provider' });
      }
    }

    res.json({ success: true, data: { canceled: true, providerResponse: null } });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});


// Manual trigger: POST /api/provider/sync-orders
app.post('/api/provider/sync-orders', async (req, res) => {
  try {
    const db = getDB();
    const { providerId } = req.body || {};

    let provider;
    if (providerId) {
      const { ObjectId } = require('mongodb');
      provider = await db.collection('providers').findOne({ _id: new ObjectId(providerId) });
      if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });
    } else {
      const settings = await db.collection('settings').findOne({ _id: 'global' });
      provider = settings?.provider;
      if (!provider) return res.status(400).json({ success: false, error: 'No active provider configured' });
    }

    const result = await runSyncForProvider(provider);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in /api/provider/sync-orders:', err);
    res.status(500).json({ success: false, error: 'Failed to sync provider orders' });
  }
});

// GET /api/provider/order/:providerOrderId - fetch a single provider order and update local record
app.get('/api/provider/order/:providerOrderId', async (req, res) => {
  try {
    const db = getDB();
    const { providerOrderId } = req.params;
    if (!providerOrderId) return res.status(400).json({ success: false, error: 'Missing providerOrderId' });

    const settings = await db.collection('settings').findOne({ _id: 'global' });
    const provider = settings?.provider;
    if (!provider) return res.status(400).json({ success: false, error: 'No provider configured' });

    const providerOrders = await fetchProviderOrdersFromApi(provider, providerOrderId);
    if (!providerOrders || providerOrders.length === 0) {
      return res.status(404).json({ success: false, error: 'Provider order not found' });
    }

    const prow = providerOrders[0];
    // Provider 'status' responses sometimes omit the id; fall back to the requested param
    const providerOrderIdNormalized = (prow.id || prow.order || prow.order_id || prow.orderId || prow.externalId || prow.key || providerOrderId || '').toString();

    // Find local order by providerOrderId
    const order = await db.collection('orders').findOne({ $or: [{ providerOrderId: providerOrderIdNormalized }, { externalId: providerOrderIdNormalized }, { orderId: providerOrderIdNormalized }] });

    const updateFields = {
      providerResponse: prow,
      providerOrderId: providerOrderIdNormalized,
      externalId: providerOrderIdNormalized,
      status: (prow.status || prow.state || prow.status_text || prow.state_text || 'processing').toString(),
      providerCancelable: Boolean(prow.cancel || prow.cancellable || prow.cancelable || prow.can_cancel || false),
      providerRefillable: Boolean(prow.refill || prow.refillable || prow.can_refill || false),
      // Prefer provider-supplied numeric/text fields when available
      amount: Number(prow.amount ?? prow.charge ?? prow.price ?? 0) || 0,
      startCount: Number(prow.start || prow.start_count || prow.startCount || 0) || 0,
      remains: Number(prow.remains || prow.remaining || prow.remain || 0) || 0,
      updatedAt: new Date(),
    };

    if (order) {
      await db.collection('orders').updateOne({ _id: order._id }, { $set: updateFields });
    }

    res.json({ success: true, data: { providerOrder: prow, updatedLocal: Boolean(order) } });
  } catch (err) {
    console.error('Error fetching provider order:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch provider order' });
  }
});

// Background periodic sync every 5 minutes
const SYNC_INTERVAL_MS = Number(process.env.PROVIDER_SYNC_INTERVAL_MS || 5 * 60 * 1000);
setInterval(async () => {
  try {
    const db = getDB();
    const providers = await db.collection('providers').find({}).toArray();
    for (const prov of providers) {
      if (prov.disableSync) continue;
      await runSyncForProvider(prov);
    }
  } catch (err) {
    console.error('Periodic provider sync failed:', err);
  }
}, SYNC_INTERVAL_MS);


async function fetchCollectionRows(db, collectionName, mapper, limit = ADMIN_LIST_LIMIT) {
  const rows = await db.collection(collectionName).find({}).sort({ _id: -1 }).limit(limit).toArray();
  return rows.map(mapper);
}

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

// ============ SETTINGS ROUTES ============
// GET /api/settings - return global settings (single doc)
app.get('/api/settings', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    res.json({ success: true, data: doc || {} });
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// POST /api/settings - upsert global settings
app.post('/api/settings', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const updatePayload = { ...req.body, updatedAt: new Date() };
    if (!Object.keys(req.body || {}).length) {
      return res.status(400).json({ success: false, error: 'No settings provided' });
    }
    const update = { $set: updatePayload };
    await col.updateOne({ _id: 'global' }, update, { upsert: true });
    const doc = await col.findOne({ _id: 'global' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Top-level payment settings endpoint (backwards compatibility)
app.get('/api/payment-settings', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('paymentSettings');
    const doc = await col.findOne({ _id: 'global' });
    if (doc && doc.methods) return res.json({ success: true, data: doc.methods });
    const rows = await col.find({}).toArray();
    if (rows && rows.length) {
      const data = {};
      for (const r of rows) {
        const k = r.key || r._id || r.method;
        data[k] = { number: r.number || '', accountType: r.accountType || 'Personal', instruction: r.instruction || '' };
      }
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Error in /api/payment-settings:', err);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// Top-level add-fund-request endpoint
app.post('/api/add-fund-request', async (req, res) => {
  try {
    const db = getDB();
    const { paymentMethod, amount, paymentNumber, clientNumber, transactionId, userId, username } = req.body || {};
    if (!paymentMethod || !amount || !paymentNumber || !clientNumber || !transactionId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const txId = String(transactionId).trim();
    if (!txId) {
      return res.status(400).json({ success: false, error: 'Transaction ID cannot be empty' });
    }
    const col = db.collection('fund_requests');
    const existing = await col.findOne({ transaction_id: txId });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This transaction ID has already been submitted' });
    }
    const normalizedUsername = normalizeUsername(username);
    const doc = {
      payment_method: paymentMethod,
      amount: Number(amount),
      payment_number: paymentNumber,
      client_number: clientNumber,
      transaction_id: txId,
      user_id: userId || null,
      username: normalizedUsername || null,
      status: 'pending',
      created_at: new Date(),
    };
    const result = await col.insertOne(doc);
    res.json({ success: true, data: { id: result.insertedId } });
  } catch (err) {
    console.error('Error in /api/add-fund-request:', err);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

app.get('/api/add-fund-request', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('fund_requests');
    const q = {};
    if (req.query.q) {
      q.$or = [
        { transaction_id: { $regex: req.query.q, $options: 'i' } },
        { client_number: { $regex: req.query.q, $options: 'i' } },
        { username: { $regex: req.query.q, $options: 'i' } },
      ];
    }
    const docs = await col.find(q).sort({ created_at: -1 }).limit(200).toArray();

    const userIds = [];
    const firebaseUids = [];
    const { ObjectId } = require('mongodb');
    for (const doc of docs) {
      if (doc.user_id) {
        if (typeof doc.user_id === 'string' && ObjectId.isValid(doc.user_id)) {
          userIds.push(new ObjectId(doc.user_id));
        } else if (typeof doc.user_id === 'string') {
          firebaseUids.push(doc.user_id);
        }
      }
    }

    let usersMap = {};
    if (userIds.length || firebaseUids.length) {
      const usersCol = db.collection('users');
      const userQuery = { $or: [] };
      if (userIds.length) userQuery.$or.push({ _id: { $in: userIds } });
      if (firebaseUids.length) userQuery.$or.push({ firebaseUid: { $in: firebaseUids } });
      const users = await usersCol.find(userQuery).toArray();
      usersMap = users.reduce((acc, user) => {
        if (user._id) acc[user._id.toString()] = user;
        if (user.firebaseUid) acc[user.firebaseUid] = user;
        return acc;
      }, {});
    }

    const enhancedDocs = docs.map((doc) => {
      const user = usersMap[doc.user_id] || null;
      const rawUsername = doc.username || (user && (user.username || user.displayName || user.email));
      return {
        ...doc,
        username: normalizeUsername(rawUsername) || null,
      };
    });

    res.json({ success: true, data: enhancedDocs });
  } catch (err) {
    console.error('Error in GET /api/add-fund-request:', err);
    res.status(500).json({ success: false, error: 'Failed to list fund requests' });
  }
});

app.post('/api/add-fund-request/:id/verify', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('fund_requests');
    const id = req.params.id;
    const { status, adminNotes } = req.body || {};
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const { ObjectId } = require('mongodb');
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    await col.updateOne({ _id: doc._id }, { $set: { status, admin_notes: adminNotes || '', updated_at: new Date() } });

    if (status === 'approved' && doc.user_id) {
      const users = db.collection('users');
      const amountBdt = Number(doc.amount) || 0;
      const conversionRate = 130; // 1 USD = 130 BDT
      const usdAmount = amountBdt > 0 ? amountBdt / conversionRate : 0;
      if (usdAmount) {
        const { ObjectId } = require('mongodb');
        let userQuery = { _id: doc.user_id };
        if (typeof doc.user_id === 'string' && ObjectId.isValid(doc.user_id)) {
          userQuery = { _id: new ObjectId(doc.user_id) };
        } else if (typeof doc.user_id === 'string') {
          userQuery = { firebaseUid: doc.user_id };
          await updateFirestoreUserBalance(doc.user_id, usdAmount);
        }

        await users.updateOne(userQuery, { $inc: { balanceUSD: usdAmount }, $set: { updatedAt: new Date() } });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in POST /api/add-fund-request/:id/verify:', err);
    res.status(500).json({ success: false, error: 'Failed to verify fund request' });
  }
});

// POST /api/users/sync-balance - Sync user balance from Firebase to MongoDB
app.post('/api/users/sync-balance', async (req, res) => {
  try {
    const { firebaseUid, email, balanceUSD } = req.body;

    if (!firebaseUid && !email) {
      return res.status(400).json({ success: false, error: 'firebaseUid or email is required' });
    }

    if (typeof balanceUSD !== 'number') {
      return res.status(400).json({ success: false, error: 'balanceUSD must be a number' });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    // Find user by firebaseUid or email
    const query = firebaseUid ? { firebaseUid } : { email };
    const user = await usersCol.findOne(query);

    if (!user) {
      console.log('⚠️ User not found for balance sync:', query);
      return res.status(404).json({ success: false, error: 'User not found in MongoDB' });
    }

    // Update balance
    await usersCol.updateOne(
      { _id: user._id },
      { $set: { balanceUSD: Math.max(0, balanceUSD), updatedAt: new Date() } }
    );

    console.log('✅ Balance synced:', { firebaseUid, email, balanceUSD });

    res.json({
      success: true,
      message: 'Balance synced successfully',
      data: { balanceUSD },
    });
  } catch (err) {
    console.error('❌ Error syncing balance:', err);
    res.status(500).json({ success: false, error: 'Failed to sync balance' });
  }
});

// ============ USER REGISTRATION ROUTES ============
// POST /api/users/register - register user in MongoDB
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, username, displayName, firebaseUid } = req.body;

    console.log('📝 User registration request:', { email, username, displayName, firebaseUid });

    if (!email || !username) {
      console.log('❌ Missing email or username');
      return res.status(400).json({ success: false, error: 'Email and username are required' });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCol.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser._id);
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user document
    const newUser = {
      email,
      username,
      displayName: displayName || username,
      firebaseUid: firebaseUid || null,
      status: 'active',
      balanceUSD: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCol.insertOne(newUser);
    console.log('✅ User registered successfully:', result.insertedId);

    res.json({
      success: true,
      message: 'User registered successfully',
      data: { _id: result.insertedId, ...newUser },
    });
  } catch (err) {
    console.error('❌ Error registering user:', err);
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
});

// GET /api/test/add-user - Test endpoint to manually add a user (development only)
app.get('/api/test/add-user', async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');

    const testUser = {
      email: 'test@example.com',
      username: 'testuser123',
      displayName: 'Test User',
      firebaseUid: null,
      status: 'active',
      balanceUSD: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if already exists
    const existing = await usersCol.findOne({ email: testUser.email });
    if (existing) {
      return res.json({ success: true, message: 'Test user already exists', data: existing });
    }

    const result = await usersCol.insertOne(testUser);
    console.log('✅ Test user created:', result.insertedId);

    res.json({
      success: true,
      message: 'Test user created successfully',
      data: { _id: result.insertedId, ...testUser },
    });
  } catch (err) {
    console.error('❌ Error creating test user:', err);
    res.status(500).json({ success: false, error: 'Failed to create test user' });
  }
});

// POST /api/users/sync-firebase - Sync a Firebase user to MongoDB
app.post('/api/users/sync-firebase', async (req, res) => {
  try {
    const { firebaseUid, email, displayName, username } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ success: false, error: 'firebaseUid and email are required' });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    // Check if already synced
    const existing = await usersCol.findOne({ firebaseUid });
    if (existing) {
      console.log('ℹ️ User already synced to MongoDB:', firebaseUid);
      return res.json({ success: true, message: 'User already synced', data: existing });
    }

    // Create MongoDB user record
    const newUser = {
      email,
      username: normalizeUsername(username) || email.split('@')[0],
      displayName: displayName || username || email.split('@')[0],
      firebaseUid,
      status: 'active',
      balanceUSD: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCol.insertOne(newUser);
    console.log('✅ Firebase user synced to MongoDB:', result.insertedId);

    res.json({
      success: true,
      message: 'User synced successfully',
      data: { _id: result.insertedId, ...newUser },
    });
  } catch (err) {
    console.error('❌ Error syncing Firebase user:', err);
    res.status(500).json({ success: false, error: 'Failed to sync user' });
  }
});

// ============ ADMIN DASHBOARD ROUTES ============
app.get('/api/admin/overview', async (req, res) => {
  try {
    const db = getDB();
    const data = await fetchAdminOverviewData(db);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error loading admin overview:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin overview' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || ADMIN_LIST_LIMIT));
    const data = await fetchCollectionRows(db, 'users', mapUserRow, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error loading admin users:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin users' });
  }
});

// GET /api/admin/users/:userId - Get detailed user information including balance and orders
app.get('/api/admin/users/:userId', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    // Fetch user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch user's orders by userId, email, or username
    const orderQuery = {
      $or: [
        { userId: user._id?.toString?.() },
        { userId: userId },
        { email: user.email },
        { userName: user.username },
        { customer: user.email },
        { customer: user.username },
      ],
    };
    
    const orders = await db.collection('orders').find(orderQuery).sort({ createdAt: -1 }).limit(50).toArray();

    // Map orders to display format
    const formattedOrders = orders.map((order) => ({
      id: order._id?.toString?.() || order.id,
      orderId: order.orderId || `ORD-${String(order._id || '').slice(-6)}`,
      service: order.service || order.serviceName || 'Service',
      amount: toNumber(order.amount ?? order.price ?? order.total ?? 0),
      status: order.status || 'pending',
      date: formatDateValue(order.createdAt || order.date),
    }));

    const totalSpent = formattedOrders.reduce((sum, order) => sum + order.amount, 0);

    res.json({
      success: true,
      data: {
        id: user._id?.toString?.() || user.id,
        name: user.displayName || user.name || user.username || 'User',
        email: user.email,
        username: user.username,
        status: user.status || 'active',
        balanceUSD: Number(user.balanceUSD || 0),
        totalOrders: orders.length,
        totalSpent: totalSpent,
        joinDate: formatDateValue(user.createdAt),
        lastActive: formatDateValue(user.lastActive || user.updatedAt),
        orders: formattedOrders.map(order => ({
          ...order,
          amount: `$${order.amount.toFixed(2)}`,
        })),
      },
    });
  } catch (err) {
    console.error('Error loading user details:', err);
    res.status(500).json({ success: false, error: 'Failed to load user details' });
  }
});

// PUT /api/admin/users/:userId - Update user balance or other details
app.put('/api/admin/users/:userId', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const { balanceUSD, status, displayName } = req.body;

    const updatePayload = {};
    if (typeof balanceUSD === 'number') updatePayload.balanceUSD = balanceUSD;
    
    // Validate and set status
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      const normalizedStatus = String(status).toLowerCase().trim();
      if (validStatuses.includes(normalizedStatus)) {
        updatePayload.status = normalizedStatus;
      } else {
        return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
    }
    
    if (displayName && typeof displayName === 'string' && displayName.trim()) {
      updatePayload.displayName = displayName.trim();
    }
    
    updatePayload.updatedAt = new Date();

    if (!Object.keys(updatePayload).length || (!status && !displayName && typeof balanceUSD !== 'number')) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// POST /api/admin/users/:userId/balance - Update user balance
app.post('/api/admin/users/:userId/balance', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const { amount, action = 'set' } = req.body;

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let newBalance;
    if (action === 'set') {
      newBalance = amount;
    } else if (action === 'add') {
      newBalance = Number(user.balanceUSD || 0) + amount;
    } else if (action === 'subtract') {
      newBalance = Number(user.balanceUSD || 0) - amount;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { balanceUSD: Math.max(0, newBalance), updatedAt: new Date() } }
    );

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    res.json({
      success: true,
      message: `Balance ${action}`,
      data: {
        userId: userId,
        newBalance: updatedUser.balanceUSD,
      },
    });
  } catch (err) {
    console.error('Error updating balance:', err);
    res.status(500).json({ success: false, error: 'Failed to update balance' });
  }
});

// GET /api/test/list-users - List all users to find the right username
app.get('/api/test/list-users', async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).project({
      _id: 1,
      username: 1,
      email: 1,
      displayName: 1,
      balanceUSD: 1,
    }).toArray();

    res.json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// GET /api/test/sync-user-by-id/:userId/:balanceUSD - Sync balance by user ID
app.get('/api/test/sync-user-by-id/:userId/:balanceUSD', async (req, res) => {
  try {
    const db = getDB();
    const { userId, balanceUSD } = req.params;
    const balance = parseFloat(balanceUSD);

    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({ success: false, error: 'Invalid balance' });
    }

    // Update user by ID
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { balanceUSD: balance, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: `User not found: ${userId}` });
    }

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    console.log(`✅ Balance synced for user ${userId}: $${balance}`);

    res.json({
      success: true,
      message: 'Balance synced successfully',
      data: {
        userId: userId,
        username: updatedUser.username,
        email: updatedUser.email,
        oldBalance: updatedUser.balanceUSD,
        newBalance: balance,
      },
    });
  } catch (err) {
    console.error('Error syncing balance by ID:', err);
    res.status(500).json({ success: false, error: 'Failed to sync balance' });
  }
});

// GET /api/users/status/:email - Check user status by email
app.get('/api/users/status/:email', async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await db.collection('users').findOne({ 
      email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (!user) {
      // User not found in MongoDB, return active status
      return res.json({ success: true, data: { status: 'active', found: false } });
    }

    res.json({ 
      success: true, 
      data: { 
        status: user.status || 'active',
        found: true,
        userId: user._id?.toString?.(),
        email: user.email,
      }
    });
  } catch (err) {
    console.error('Error checking user status:', err);
    res.status(500).json({ success: false, error: 'Failed to check user status' });
  }
});

// GET /api/test/sync-user-balance/:username/:balanceUSD - Test endpoint to manually sync a user's balance
app.get('/api/test/sync-user-balance/:username/:balanceUSD', async (req, res) => {
  try {
    const db = getDB();
    const { username, balanceUSD } = req.params;
    const balance = parseFloat(balanceUSD);

    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({ success: false, error: 'Invalid balance' });
    }

    // Find user by username (case-insensitive)
    const user = await db.collection('users').findOne({ 
      username: new RegExp(`^${username}$`, 'i')
    });

    if (!user) {
      return res.status(404).json({ success: false, error: `User not found: ${username}` });
    }

    const oldBalance = user.balanceUSD;

    // Update balance
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { balanceUSD: balance, updatedAt: new Date() } }
    );

    console.log(`✅ Balance synced for ${username}: $${oldBalance} → $${balance}`);

    res.json({
      success: true,
      message: 'Balance synced successfully',
      data: {
        username: username,
        oldBalance: oldBalance,
        newBalance: balance,
        userId: user._id.toString(),
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Error syncing balance:', err);
    res.status(500).json({ success: false, error: 'Failed to sync balance' });
  }
});

// GET /api/test/migrate-usernames - Migrate all existing users to use email-based usernames
app.get('/api/test/migrate-usernames', async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).toArray();
    
    if (!users.length) {
      return res.json({ success: true, message: 'No users to migrate', migrated: 0 });
    }

    let migrated = 0;
    const updates = [];

    for (const user of users) {
      if (!user.email) continue;

      // Generate username from full email
      const newUsername = user.email.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
      
      // Generate display name from email (clean format)
      const emailPrefix = user.email.split('@')[0];
      const generatedDisplayName = emailPrefix
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Check if displayName has quotes, unusual patterns, or is just a username
      const hasQuotes = user.displayName && user.displayName.includes('"');
      const hasNumbersAfterText = user.displayName && /[a-z]\s+\d{10,}/i.test(user.displayName);
      const looksLikeUsername = user.displayName && user.displayName === user.username;
      
      const needsFixing = hasQuotes || hasNumbersAfterText || looksLikeUsername || !user.displayName;
      
      if (needsFixing) {
        updates.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { username: newUsername, displayName: generatedDisplayName } }
          }
        });
        migrated++;
      } else if (user.username !== newUsername) {
        updates.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { username: newUsername } }
          }
        });
        migrated++;
      }
    }

    if (updates.length > 0) {
      await db.collection('users').bulkWrite(updates);
    }

    console.log(`✅ Migrated ${migrated} user records`);

    res.json({
      success: true,
      message: `Migrated ${migrated} user records to proper format`,
      migrated,
      totalUsers: users.length,
    });
  } catch (err) {
    console.error('Error migrating usernames:', err);
    res.status(500).json({ success: false, error: 'Failed to migrate usernames' });
  }
});

// GET /api/test/fix-display-names - Force fix all displayNames based on email
app.get('/api/test/fix-display-names', async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).toArray();
    
    if (!users.length) {
      return res.json({ success: true, message: 'No users to fix', fixed: 0 });
    }

    let fixed = 0;

    for (const user of users) {
      if (!user.email) continue;

      // Generate proper display name from email
      const emailPrefix = user.email.split('@')[0];
      const properDisplayName = emailPrefix
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Update displayName to proper format
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { displayName: properDisplayName } }
      );
      
      fixed++;
    }

    console.log(`✅ Fixed ${fixed} display names`);

    res.json({
      success: true,
      message: `Fixed ${fixed} display names to proper format`,
      fixed,
      totalUsers: users.length,
    });
  } catch (err) {
    console.error('Error fixing display names:', err);
    res.status(500).json({ success: false, error: 'Failed to fix display names' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || ADMIN_LIST_LIMIT));
    const data = await fetchCollectionRows(db, 'orders', mapOrderRow, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error loading admin orders:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin orders' });
  }
});

// Admin helper: link a provider order id to a local order by orderId (development only)
app.post('/api/admin/orders/:orderId/link-provider', async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const { providerOrderId } = req.body || {};
    if (!providerOrderId) return res.status(400).json({ success: false, error: 'providerOrderId required' });

    const order = await db.collection('orders').findOne({ orderId: orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    await db.collection('orders').updateOne({ _id: order._id }, { $set: { providerOrderId: String(providerOrderId), externalId: String(providerOrderId), updatedAt: new Date() } });

    res.json({ success: true, data: { linked: true, orderId, providerOrderId } });
  } catch (err) {
    console.error('Error linking provider id:', err);
    res.status(500).json({ success: false, error: 'Failed to link provider id' });
  }
});

// Admin helper: return raw order document (development only)
app.get('/api/admin/order/:orderId/raw', async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const order = await db.collection('orders').findOne({ orderId: orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('Error fetching raw order:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch raw order' });
  }
});

// GET /api/orders/user/:email - Get orders for a specific user
app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.params;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || ADMIN_LIST_LIMIT));
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Missing email' });
    }

    const query = {
      email: { $regex: `^${email}$`, $options: 'i' },
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await db.collection('orders')
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, data: orders.map(mapUserOrderRow) });
  } catch (err) {
    console.error('Error loading user orders:', err);
    res.status(500).json({ success: false, error: 'Failed to load user orders' });
  }
});

// POST create new order and deduct balance
app.post('/api/orders/create', async (req, res) => {
  try {
    const db = getDB();
    const { email, serviceName, link, quantity, chargeAmount, currency, providerServiceId } = req.body;

    if (!email || !serviceName || !link || !quantity || !chargeAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const chargeNumeric = parseFloat(chargeAmount) || 0;
    if (chargeNumeric <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid charge amount' });
    }

    // Find user by email
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user has sufficient balance
    const currentBalance = parseFloat(user.balanceUSD || 0);
    if (currentBalance < chargeNumeric) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Create order
    const ordersCollection = db.collection('orders');
    const orderId = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    const newOrder = {
      orderId: orderId,
      customer: email,
      email: email,
      service: serviceName,
      providerServiceId: providerServiceId || null,
      link: link,
      quantity: parseInt(quantity),
      amount: chargeNumeric,
      currency: currency || 'USD',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult = await ordersCollection.insertOne(newOrder);

    // Deduct balance from user
    const newBalance = currentBalance - chargeNumeric;
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { balanceUSD: newBalance },
        $inc: { 
          totalOrders: 1,
          totalSpent: chargeNumeric,
        },
      }
    );

    res.json({
      success: true,
      data: {
        orderId: orderId,
        newBalance: newBalance,
        message: 'Order created successfully',
      },
    });
    
    // Attempt to push the order to the configured provider in background
    (async () => {
      try {
        const settings = await db.collection('settings').findOne({ _id: 'global' });
        const provider = settings?.provider;
        if (!provider || provider.disableSync) {
          console.log('No provider configured or sync disabled, skipping push for order', orderId);
          return;
        }

        const createdOrder = await ordersCollection.findOne({ _id: orderResult.insertedId });
        const pushResult = await pushOrderToProvider(provider, createdOrder);

        if (pushResult && pushResult.providerOrderId) {
              const updateFields = {
                providerOrderId: pushResult.providerOrderId,
                externalId: pushResult.providerOrderId,
                providerResponse: pushResult.raw,
                status: pushResult.status || 'processing',
                updatedAt: new Date(),
              };
              if (typeof pushResult.providerCancelable !== 'undefined') updateFields.providerCancelable = Boolean(pushResult.providerCancelable);
              if (typeof pushResult.providerRefillable !== 'undefined') updateFields.providerRefillable = Boolean(pushResult.providerRefillable);
              await ordersCollection.updateOne({ _id: createdOrder._id }, { $set: updateFields });
        } else if (pushResult && pushResult.error) {
              const updateFields = { providerError: pushResult.error, providerResponse: pushResult.raw || null, updatedAt: new Date() };
              if (typeof pushResult.providerCancelable !== 'undefined') updateFields.providerCancelable = Boolean(pushResult.providerCancelable);
              if (typeof pushResult.providerRefillable !== 'undefined') updateFields.providerRefillable = Boolean(pushResult.providerRefillable);
              await ordersCollection.updateOne({ _id: createdOrder._id }, { $set: updateFields });
        }
      } catch (err) {
        console.error('Background push to provider failed for order', orderId, err);
      }
    })();
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// GET /api/orders/check-link/:email/:link - Check for active orders with same link
app.get('/api/orders/check-link/:email/:link', async (req, res) => {
  try {
    const db = getDB();
    const { email, link } = req.params;
    const decodedLink = decodeURIComponent(link);

    if (!email || !decodedLink) {
      return res.status(400).json({ success: false, error: 'Missing email or link' });
    }

    // Check for active orders with this link
    const ordersCollection = db.collection('orders');
    const activeOrder = await ordersCollection.findOne({
      email: { $regex: `^${email}$`, $options: 'i' },
      link: decodedLink,
      status: { $in: ['pending', 'processing'] },
    });

    res.json({
      success: true,
      data: {
        hasActiveOrder: !!activeOrder,
        activeOrder: activeOrder ? {
          orderId: activeOrder.orderId,
          service: activeOrder.service,
          status: activeOrder.status,
        } : null,
      },
    });
  } catch (err) {
    console.error('Error checking active orders:', err);
    res.status(500).json({ success: false, error: 'Failed to check orders' });
  }
});

app.get('/api/admin/tickets', async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || ADMIN_LIST_LIMIT));
    const data = await fetchCollectionRows(db, 'tickets', mapTicketRow, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error loading admin tickets:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin tickets' });
  }
});

app.get('/api/admin/tickets/:ticketId', async (req, res) => {
  try {
    const db = getDB();
    const ticket = await findTicketByTicketId(db, req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const viewer = pickFirstString(req.query.viewer, '');
    const viewedTicket = viewer ? await markTicketReadForViewer(db, ticket, viewer) : ticket;

    res.json({ success: true, data: mapTicketThread(viewedTicket) });
  } catch (err) {
    console.error('Error loading admin ticket thread:', err);
    res.status(500).json({ success: false, error: 'Failed to load ticket thread' });
  }
});

app.post('/api/admin/tickets/:ticketId/replies', async (req, res) => {
  try {
    const db = getDB();
    const ticket = await findTicketByTicketId(db, req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const message = pickFirstString(req.body.message, '');
    const authorName = pickFirstString(req.body.authorName, 'Admin');

    if (!message) {
      return res.status(400).json({ success: false, error: 'Reply message is required' });
    }

    const reply = await appendTicketReply(db, ticket, {
      authorType: 'admin',
      authorName,
      authorEmail: pickFirstString(req.body.authorEmail, 'admin@smmgen.local'),
      message,
    }, 'answered');

    res.json({ success: true, data: mapTicketReplyRow(reply) });
  } catch (err) {
    console.error('Error saving admin ticket reply:', err);
    res.status(500).json({ success: false, error: 'Failed to save reply' });
  }
});

app.post('/api/admin/tickets/:ticketId/close', async (req, res) => {
  try {
    const db = getDB();
    const ticket = await findTicketByTicketId(db, req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    await db.collection('tickets').updateOne(
      { _id: ticket._id },
      { $set: { status: 'closed', updatedAt: new Date(), unreadForUser: 0, unreadForAdmin: 0 } }
    );

    const updatedTicket = await findTicketByTicketId(db, req.params.ticketId);
    res.json({ success: true, data: mapTicketThread(updatedTicket) });
  } catch (err) {
    console.error('Error closing admin ticket:', err);
    res.status(500).json({ success: false, error: 'Failed to close ticket' });
  }
});

app.get('/api/tickets/user/:email', async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.params;
    const status = normalizeStatus(req.query.status, 'all');
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));

    if (!email) {
      return res.status(400).json({ success: false, error: 'Missing email' });
    }

    const query = {
      email: { $regex: `^${email}$`, $options: 'i' },
    };

    if (status !== 'all') {
      query.status = status;
    }

    const tickets = await db.collection('tickets')
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, data: tickets.map(mapTicketThread) });
  } catch (err) {
    console.error('Error loading user tickets:', err);
    res.status(500).json({ success: false, error: 'Failed to load user tickets' });
  }
});

app.get('/api/tickets/:ticketId', async (req, res) => {
  try {
    const db = getDB();
    const ticket = await findTicketByTicketId(db, req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const viewer = pickFirstString(req.query.viewer, '');
    const viewedTicket = viewer ? await markTicketReadForViewer(db, ticket, viewer) : ticket;

    res.json({ success: true, data: mapTicketThread(viewedTicket) });
  } catch (err) {
    console.error('Error loading ticket thread:', err);
    res.status(500).json({ success: false, error: 'Failed to load ticket thread' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const db = getDB();
    const email = pickFirstString(req.body.email, req.body.userEmail);
    const name = pickFirstString(req.body.name, req.body.userName);
    const category = pickFirstString(req.body.category, 'AI Support');
    const subcategory = pickFirstString(req.body.subcategory, req.body.subCategory, 'General');
    const subject = pickFirstString(req.body.subject, subcategory, 'Support Request');
    const message = pickFirstString(req.body.message, req.body.description);

    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const ticketId = `TKT-${String(Date.now()).slice(-8)}`;
    const ticketDoc = {
      ticketId,
      email,
      name,
      category,
      subcategory,
      subject,
      message,
      status: 'pending',
      priority: normalizeStatus(req.body.priority, 'medium'),
      replies: [],
      unreadForUser: 0,
      unreadForAdmin: 0,
      lastReplyAuthorType: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('tickets').insertOne(ticketDoc);
    res.json({ success: true, data: mapTicketThread(ticketDoc) });
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

app.post('/api/tickets/:ticketId/replies', async (req, res) => {
  try {
    const db = getDB();
    const ticket = await findTicketByTicketId(db, req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const email = pickFirstString(req.body.email, req.body.userEmail);
    const message = pickFirstString(req.body.message, '');

    if (!email || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (ticket.email && ticket.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'You can only reply to your own ticket' });
    }

    const reply = await appendTicketReply(db, ticket, {
      authorType: 'user',
      authorName: pickFirstString(req.body.name, ticket.name, ticket.email, 'User'),
      authorEmail: email,
      message,
    }, 'pending');

    res.json({ success: true, data: mapTicketReplyRow(reply) });
  } catch (err) {
    console.error('Error saving ticket reply:', err);
    res.status(500).json({ success: false, error: 'Failed to save reply' });
  }
});

// ============ PROVIDERS ROUTES ============
// GET all providers
app.get('/api/providers', async (req, res) => {
  try {
    const db = getDB();
    const providers = await db.collection('providers').find({}).toArray();
    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch providers' });
  }
});

// GET single provider
app.get('/api/providers/:id', async (req, res) => {
  try {
    const db = getDB();
    const provider = await db.collection('providers').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider' });
  }
});

// POST create new provider
app.post('/api/providers', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ success: false, message: 'API URL and Key are required' });
    }

    const db = getDB();
    const provider = {
      name: name || new URL(apiUrl).hostname,
      apiUrl,
      apiKey,
      disableSync: disableSync || false,
      loginUsername: loginUsername || '',
      loginPassword: loginPassword || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('providers').insertOne(provider);
    res.json({ success: true, data: { ...provider, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ success: false, message: 'Failed to create provider' });
  }
});

// PUT update provider
app.put('/api/providers/:id', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, disableSync, loginUsername, loginPassword } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ success: false, message: 'API URL and Key are required' });
    }

    const db = getDB();
    const updateData = {
      name: name || new URL(apiUrl).hostname,
      apiUrl,
      apiKey,
      disableSync: disableSync || false,
      loginUsername: loginUsername || '',
      loginPassword: loginPassword || '',
      updatedAt: new Date(),
    };

    const result = await db.collection('providers').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    res.json({ success: true, data: { ...updateData, _id: req.params.id } });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ success: false, message: 'Failed to update provider' });
  }
});

// DELETE provider
app.delete('/api/providers/:id', async (req, res) => {
  try {
    const db = getDB();
    const providerId = new ObjectId(req.params.id);
    const providerToDelete = await db.collection('providers').findOne({ _id: providerId });

    if (!providerToDelete) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const result = await db.collection('providers').deleteOne({ _id: providerId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const settingsCollection = db.collection('settings');
    const globalSettings = await settingsCollection.findOne({ _id: 'global' });
    const activeProvider = globalSettings?.provider;

    const activeProviderId = activeProvider?._id?.toString?.() || activeProvider?._id;
    const deletedProviderId = providerToDelete._id.toString();
    const activeProviderMatchesDeleted =
      (activeProviderId && activeProviderId === deletedProviderId) ||
      (activeProvider?.apiUrl && activeProvider.apiUrl === providerToDelete.apiUrl);

    if (activeProviderMatchesDeleted) {
      const fallbackProvider = await db.collection('providers').findOne({});

      if (fallbackProvider) {
        await settingsCollection.updateOne(
          { _id: 'global' },
          { $set: { provider: fallbackProvider, updatedAt: new Date() } },
          { upsert: true }
        );
      } else {
        await settingsCollection.updateOne(
          { _id: 'global' },
          { $unset: { provider: '' }, $set: { updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }

    res.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ success: false, message: 'Failed to delete provider' });
  }
});

// ============ PROVIDER PROXY ROUTES ============
// GET /api/provider/categories - return cached category summary
app.get('/api/provider/categories', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    const provider = doc?.provider;

    if (!provider || !provider.apiUrl) {
      return res.status(400).json({ success: false, error: 'No provider configured' });
    }

    const apiUrl = provider.apiUrl;
    const apiKey = provider.apiKey;
    const cacheKey = `${apiUrl}::${apiKey || ''}`;
    const cacheIsFresh = providerServicesCache.providerKey === cacheKey
      && providerServicesCache.services.length > 0
      && (Date.now() - providerServicesCache.fetchedAt) < PROVIDER_SERVICES_CACHE_TTL_MS;

    let allServices = providerServicesCache.services;

    if (!cacheIsFresh) {
      const params = new URLSearchParams();
      if (apiKey) params.append('key', apiKey);
      params.append('action', 'services');

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: params,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: 'Provider returned error' });
      }

      const data = await response.json();
      allServices = Array.isArray(data) ? data : (data.data || []);

      if (!Array.isArray(allServices)) {
        return res.status(500).json({ success: false, error: 'Invalid provider response format' });
      }

      providerServicesCache.providerKey = cacheKey;
      providerServicesCache.fetchedAt = Date.now();
      providerServicesCache.services = allServices;
    }

    const categories = new Map();

    allServices.forEach((service) => {
      const categoryName = mapServiceCategoryToMainCategory(service?.category || service?.type || 'Others');
      const current = categories.get(categoryName) || { label: categoryName, count: 0 };
      current.count += 1;
      categories.set(categoryName, current);
    });

    const orderedCategories = [
      'Instagram',
      'Facebook',
      'Youtube',
      'Twitter',
      'Spotify',
      'TikTok',
      'Telegram',
      'LinkedIn',
      'Discord',
      'Website Traffic',
      'Others',
    ];

    const summary = orderedCategories.map((label) => ({
      label,
      count: categories.get(label)?.count || 0,
    }));

    res.json({
      success: true,
      data: summary,
      total: allServices.length,
    });
  } catch (err) {
    console.error('Provider category summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load category summary', message: err.message });
  }
});

// GET /api/provider/subcategories - return unique raw subcategories grouped by main category
app.get('/api/provider/subcategories', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    const provider = doc?.provider;

    if (!provider || !provider.apiUrl) {
      return res.status(400).json({ success: false, error: 'No provider configured' });
    }

    const apiUrl = provider.apiUrl;
    const apiKey = provider.apiKey;
    const cacheKey = `${apiUrl}::${apiKey || ''}`;
    const cacheIsFresh = providerServicesCache.providerKey === cacheKey
      && providerServicesCache.services.length > 0
      && (Date.now() - providerServicesCache.fetchedAt) < PROVIDER_SERVICES_CACHE_TTL_MS;

    let allServices = providerServicesCache.services;

    if (!cacheIsFresh) {
      const params = new URLSearchParams();
      if (apiKey) params.append('key', apiKey);
      params.append('action', 'services');

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: params,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: 'Provider returned error' });
      }

      const data = await response.json();
      allServices = Array.isArray(data) ? data : (data.data || []);

      if (!Array.isArray(allServices)) {
        return res.status(500).json({ success: false, error: 'Invalid provider response format' });
      }

      providerServicesCache.providerKey = cacheKey;
      providerServicesCache.fetchedAt = Date.now();
      providerServicesCache.services = allServices;
    }

    const grouped = new Map();
    allServices.forEach((service) => {
      const main = mapServiceCategoryToMainCategory(service?.category || service?.type || 'Others');
      const raw = (service?.category || service?.type || '').toString().trim();
      const set = grouped.get(main) || new Set();
      if (raw) set.add(raw);
      grouped.set(main, set);
    });

    const result = Array.from(grouped.entries()).map(([main, set]) => ({
      main,
      subcategories: Array.from(set).sort(),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Provider subcategory summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load subcategory summary', message: err.message });
  }
});

// GET /api/provider/services - proxy to configured provider with PAGINATION
app.get('/api/provider/services', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('settings');
    const doc = await col.findOne({ _id: 'global' });
    const provider = doc?.provider;
    
    if (!provider || !provider.apiUrl) {
      return res.status(400).json({ success: false, error: 'No provider configured' });
    }

    const apiUrl = provider.apiUrl;
    const apiKey = provider.apiKey;
    const selectedCategory = (req.query.category || '').toString().trim();
    const selectedSubcategory = (req.query.subcategory || '').toString().trim();
    const searchTerm = (req.query.search || '').toString().trim().toLowerCase();
    const normalizedCategory = selectedCategory && selectedCategory.toLowerCase() !== 'everything'
      ? selectedCategory
      : '';
    const normalizedSubcategory = selectedSubcategory && selectedSubcategory.toLowerCase() !== 'everything'
      ? selectedSubcategory
      : '';

    const parseBooleanFilter = (value) => {
      const normalized = (value || '').toString().trim().toLowerCase();
      if (!normalized || normalized === 'all') return null;
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
      return null;
    };

    const refillFilter = parseBooleanFilter(req.query.refill);
    const cancelFilter = parseBooleanFilter(req.query.cancel);

    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit) || 50)); // cap at 10000, default 50

    const cacheKey = `${apiUrl}::${apiKey || ''}`;
    const cacheIsFresh = providerServicesCache.providerKey === cacheKey
      && providerServicesCache.services.length > 0
      && (Date.now() - providerServicesCache.fetchedAt) < PROVIDER_SERVICES_CACHE_TTL_MS;

    let allServices = providerServicesCache.services;

    if (!cacheIsFresh) {
      const params = new URLSearchParams();
      if (apiKey) params.append('key', apiKey);
      params.append('action', 'services');

      console.log(`📤 Proxying to ${apiUrl} (refresh cache, category=${normalizedCategory || 'all'}, subcategory=${normalizedSubcategory || 'all'}, search=${searchTerm || 'all'}, refill=${refillFilter ?? 'all'}, cancel=${cancelFilter ?? 'all'}, page=${page}, limit=${limit})`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: params,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        console.error(`Provider returned status ${response.status}`);
        return res.status(response.status).json({ success: false, error: 'Provider returned error' });
      }

      const data = await response.json();
      allServices = Array.isArray(data) ? data : (data.data || []);

      if (!Array.isArray(allServices)) {
        console.error('Provider response is not an array');
        return res.status(500).json({ success: false, error: 'Invalid provider response format' });
      }

      providerServicesCache.providerKey = cacheKey;
      providerServicesCache.fetchedAt = Date.now();
      providerServicesCache.services = allServices;
    } else {
      console.log(`♻️ Using cached services for ${apiUrl} (category=${normalizedCategory || 'all'}, subcategory=${normalizedSubcategory || 'all'}, search=${searchTerm || 'all'}, refill=${refillFilter ?? 'all'}, cancel=${cancelFilter ?? 'all'}, page=${page}, limit=${limit})`);
    }

    const filteredServices = allServices.filter((service) => {
      const mainCategory = mapServiceCategoryToMainCategory(service?.category || service?.type || 'Others');
      const rawCategory = (service?.category || service?.type || '').toString().trim();
      const searchableText = [
        service?.service,
        service?.name,
        service?.category,
        service?.type,
        service?.description,
        service?.details,
        service?.note,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(' ');

      const matchesCategory = normalizedCategory
        ? mainCategory.toLowerCase() === normalizedCategory.toLowerCase()
        : true;

      const matchesSubcategory = normalizedSubcategory
        ? rawCategory.toLowerCase() === normalizedSubcategory.toLowerCase()
        : true;

      const matchesSearch = searchTerm
        ? searchableText.includes(searchTerm)
        : true;

      const serviceRefill = service?.refill === 1 || service?.refill === true || service?.refill === 'true';
      const serviceCancel = service?.cancel === 1 || service?.cancel === true || service?.cancel === 'true';
      const matchesRefill = refillFilter === null ? true : serviceRefill === refillFilter;
      const matchesCancel = cancelFilter === null ? true : serviceCancel === cancelFilter;

      return matchesCategory && matchesSubcategory && matchesSearch && matchesRefill && matchesCancel;
    });

    const summaryCounts = filteredServices.reduce((acc, service) => {
      const serviceRefill = service?.refill === 1 || service?.refill === true || service?.refill === 'true';
      const serviceCancel = service?.cancel === 1 || service?.cancel === true || service?.cancel === 'true';

      if (serviceRefill) acc.refillableTotal += 1;
      if (serviceCancel) acc.cancellableTotal += 1;

      return acc;
    }, { refillableTotal: 0, cancellableTotal: 0 });

    // Determine if this is an admin request (include providerPrice and profit fields)
    const isAdmin = String(req.query.admin || '').toLowerCase() === 'true';

    // Provider-level stored pricing map (optional)
    const providerPricingMap = (provider && provider.servicePricing) ? provider.servicePricing : {};

    // Apply pagination
    const total = filteredServices.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedServices = filteredServices.slice(start, end).map((svc) => {
      const providerPrice = parseFloat(svc.rate || svc.price || 0) || 0;
      const svcKey = String(svc.service || svc.id || svc._id || '');

      const stored = providerPricingMap[svcKey] || {};
      const profitPercentage = typeof stored.profitPercentage === 'number'
        ? stored.profitPercentage
        : (provider && typeof provider.defaultProfitPercentage === 'number' ? provider.defaultProfitPercentage : 0);

      const sellingPrice = roundNumber(providerPrice * (1 + (profitPercentage || 0) / 100), 4);

      // Prepare returned service object
      const out = { ...svc };
      // For admin requests include providerPrice and profitPercentage explicitly
      if (isAdmin) {
        out.providerPrice = providerPrice;
        out.profitPercentage = profitPercentage;
        out.sellingPrice = sellingPrice;
      } else {
        // For regular clients, expose only selling price as `price` to avoid revealing providerPrice
        out.price = sellingPrice;
        // remove raw provider rate to avoid accidental exposure
        delete out.rate;
      }

      return out;
    });

    console.log(`✅ Fetched ${total} services, returning ${paginatedServices.length} (page ${page}/${Math.ceil(total / limit)}) [admin=${isAdmin}]`);

    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: end < total,
        ...summaryCounts,
      },
    });
  } catch (err) {
    console.error('Provider proxy error:', err);
    res.status(500).json({ success: false, error: 'Failed to proxy to provider', message: err.message });
  }
});

// PUT /api/providers/:id/service-pricing - set per-service profitPercentage (single or bulk)
app.put('/api/providers/:id/service-pricing', async (req, res) => {
  try {
    const providerId = req.params.id;
    const { serviceId, profitPercentage, bulk } = req.body;

    if (!providerId) return res.status(400).json({ success: false, error: 'provider id required' });

    const db = getDB();
    const col = db.collection('providers');
    const providerObj = await col.findOne({ _id: new ObjectId(providerId) });
    if (!providerObj) return res.status(404).json({ success: false, error: 'provider not found' });

    const update = { ...(providerObj.servicePricing || {}) };

    if (bulk && typeof bulk === 'object') {
      // bulk is an object { serviceId: { profitPercentage } }
      Object.keys(bulk).forEach((sid) => {
        const p = bulk[sid];
        update[String(sid)] = update[String(sid)] || {};
        if (typeof p.profitPercentage === 'number') update[String(sid)].profitPercentage = p.profitPercentage;
      });
    } else {
      if (!serviceId) return res.status(400).json({ success: false, error: 'serviceId required' });
      if (typeof profitPercentage !== 'number') return res.status(400).json({ success: false, error: 'profitPercentage must be a number' });
      update[String(serviceId)] = update[String(serviceId)] || {};
      update[String(serviceId)].profitPercentage = profitPercentage;
    }

    await col.updateOne({ _id: new ObjectId(providerId) }, { $set: { servicePricing: update, updatedAt: new Date() } });

    // Also update global settings.provider if it matches this provider in settings
    const settingsCol = db.collection('settings');
    const settingsDoc = await settingsCol.findOne({ _id: 'global' });
    if (settingsDoc && settingsDoc.provider && String(settingsDoc.provider._id) === String(providerId)) {
      const newProvider = { ...settingsDoc.provider, servicePricing: update };
      await settingsCol.updateOne({ _id: 'global' }, { $set: { provider: newProvider, updatedAt: new Date() } });
    }

    const updatedProvider = await col.findOne({ _id: new ObjectId(providerId) });
    res.json({ success: true, data: updatedProvider });
  } catch (err) {
    console.error('Error updating provider service pricing:', err);
    res.status(500).json({ success: false, error: 'Failed to update service pricing' });
  }
});

function roundNumber(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

function mapServiceCategoryToMainCategory(serviceCategory) {
  if (!serviceCategory) return 'Others';

  const raw = String(serviceCategory).toLowerCase().trim();

  const platforms = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'Youtube',
    youtuber: 'Youtube',
    twitter: 'Twitter',
    'x-twitter': 'Twitter',
    spotify: 'Spotify',
    tiktok: 'TikTok',
    'tik tok': 'TikTok',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    discord: 'Discord',
    website: 'Website Traffic',
    traffic: 'Website Traffic',
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

  const parts = raw.split(/[\/|,;–—\-]/).map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    for (const key in platforms) {
      const re = new RegExp('\\b' + escapeRegExp(key) + '\\b');
      if (re.test(part)) return platforms[key];
    }
  }

  const priority = ['instagram','facebook','youtube','twitter','spotify','tiktok','telegram','linkedin','discord','website','traffic'];
  for (const key of priority) {
    const re = new RegExp('\\b' + escapeRegExp(key) + '\\b');
    if (re.test(raw)) return platforms[key];
  }

  return 'Others';
}

// Register payments API (must be before 404 handler)
try {
  const paymentsRouter = require('./routes/payments');
  app.use('/api/payments', paymentsRouter);
} catch (err) {
  console.warn('Payments router not registered:', err.message);
}

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
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
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
