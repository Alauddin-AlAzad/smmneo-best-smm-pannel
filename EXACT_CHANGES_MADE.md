# EXACT CHANGES MADE - Line-by-Line Reference

## File: smmneo-server/index.js

### CHANGE #1: Initialize providerStatus on Order Creation
**Location**: Lines 2361-2384 (background push after order creation)

**Exact Query/Code**:
```javascript
// MongoDB Update Query (line 2383):
const result = await ordersCollection.updateOne({ _id: createdOrder._id }, { $set: updateFields });

// updateFields object (lines 2364-2374):
const updateFields = {
  providerOrderId: pushResult.providerOrderId,
  externalId: pushResult.providerOrderId,
  providerResponse: pushResult.raw,
  status: mappedStatus,                              // ← Uses mapProviderStatusToLocal()
  providerStatus: String(rawProviderStatus),         // ← NEW: This was missing before
  updatedAt: new Date(),
};

// Full context (lines 2361-2384):
if (pushResult && pushResult.providerOrderId) {
  const rawProviderStatus = pushResult.status || 'processing';
  const mappedStatus = mapProviderStatusToLocal(rawProviderStatus);
  console.log(`[ORDER-CREATE-PUSH] Order ${pushResult.providerOrderId}: Raw="${rawProviderStatus}" → Mapped="${mappedStatus}"`);
  
  const updateFields = {
    providerOrderId: pushResult.providerOrderId,
    externalId: pushResult.providerOrderId,
    providerResponse: pushResult.raw,
    status: mappedStatus,
    providerStatus: String(rawProviderStatus),     // ← FIX: Initialize here
    updatedAt: new Date(),
  };
  if (typeof pushResult.providerCancelable !== 'undefined') updateFields.providerCancelable = Boolean(pushResult.providerCancelable);
  if (typeof pushResult.providerRefillable !== 'undefined') updateFields.providerRefillable = Boolean(pushResult.providerRefillable);
  
  const result = await ordersCollection.updateOne({ _id: createdOrder._id }, { $set: updateFields });
  console.log(`[ORDER-CREATE-PUSH] Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
}
```

**Result**: When order created and pushed to provider, BOTH `status` and `providerStatus` are now set.

---

### CHANGE #2: Add Final Status Protection in reconcileProviderOrders()
**Location**: Lines 680-693 (inside reconcileProviderOrders function)

**Exact Code**:
```javascript
// Extract and map status (lines 671-689):
const rawProviderStatus = prow.status || prow.state || prow.status_text || prow.state_text || 
  prow.order_status || prow.orderStatus || prow.statusMessage || prow.status_message || 
  prow.status_name || prow.statusName || prow.current_status || prow.currentStatus || 
  prow.order_status_text || prow.status_description || 'pending';

const mappedStatus = mapProviderStatusToLocal(rawProviderStatus);

console.log(`[BULK-SYNC] Order ${providerOrderId}: Raw="${rawProviderStatus}" → Mapped="${mappedStatus}" | Found=${!!existing} | LocalStatus=${statusBeforeUpdate}`);

// NEW PROTECTION (lines 680-693):
const finalStatuses = ['completed', 'canceled', 'partial', 'failed'];
const shouldUpdate = !existing || !finalStatuses.includes(String(existing.status || '').toLowerCase());

if (existing && !shouldUpdate) {
  console.log(`[BULK-SYNC] ⚠️  Skipping update - order already in final status "${existing.status}"`);
  skipped++;
  continue;  // ← SKIP: Don't downgrade from final status
}

// Then proceeds with update for non-final statuses...
```

**Result**: Orders in final states (completed, canceled, partial, failed) won't be updated to lower states.

---

### CHANGE #3: Add Final Status Protection in GET /api/provider/order
**Location**: Lines 1082-1102 (inside single-order refresh endpoint)

**Exact Code**:
```javascript
// Status extraction and mapping (lines 1073-1088):
const rawProviderStatus = prow.status || prow.state || prow.status_text || prow.state_text ||
  prow.order_status || prow.orderStatus || prow.statusMessage || prow.status_message ||
  prow.status_name || prow.statusName || prow.current_status || prow.currentStatus ||
  prow.order_status_text || prow.status_description || 'processing';

console.log(`[PROVIDER-SYNC-TRACE] 📊 Status Mapping:`);
console.log(`[PROVIDER-SYNC-TRACE] - Raw provider status: "${rawProviderStatus}"`);

const mappedStatus = mapProviderStatusToLocal(rawProviderStatus);
console.log(`[PROVIDER-SYNC-TRACE] - Mapped to local status: "${mappedStatus}"`);

// NEW PROTECTION (lines 1090-1102):
const finalStatuses = ['completed', 'canceled', 'partial', 'failed'];
if (order && finalStatuses.includes(String(order.status || '').toLowerCase())) {
  console.log(`[PROVIDER-SYNC-TRACE] ⚠️  PROTECTED: Order already in final status "${order.status}"`);
  console.log(`[PROVIDER-SYNC-TRACE] ⚠️  NOT updating to "${mappedStatus}" to avoid downgrade`);
  
  res.json({ 
    success: true, 
    data: { 
      providerOrder: prow, 
      updatedLocal: false, 
      mappedStatus, 
      rawProviderStatus,
      reason: 'Order in final status - update blocked for protection'
    } 
  });
  return;  // ← EXIT: Don't update this order
}

// Then proceeds with update...
```

**Result**: GET endpoint refuses to downgrade completed/canceled orders.

---

### CHANGE #4: Add Test Endpoint for Complete Flow Tracing
**Location**: Lines 950-1095 (new endpoint)

**Exact Endpoint**:
```javascript
// TEST ENDPOINT: POST /api/test/trace-order-sync/:orderId
app.post('/api/test/trace-order-sync/:orderId', async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    
    console.log(`\n${'='.repeat(100)}`);
    console.log(`[TEST-TRACE] 🔍 STARTING COMPLETE SYNC TRACE FOR ORDER: ${orderId}`);
    
    // STEP 1: Find local order
    const localOrder = await db.collection('orders').findOne({ 
      $or: [
        { orderId: orderId },
        { providerOrderId: orderId },
        { externalId: orderId }
      ]
    });
    
    // STEP 2: Get provider config
    const settings = await db.collection('settings').findOne({ _id: 'global' });
    const provider = settings?.provider;
    
    // STEP 3: Call provider API
    const providerOrders = await fetchProviderOrdersFromApi(provider, localOrder.providerOrderId || orderId);
    const providerOrder = providerOrders[0];
    
    // STEP 4: Extract raw status (14 different field names)
    const rawProviderStatus = providerOrder.status || providerOrder.state || 
      providerOrder.status_text || providerOrder.state_text || 
      providerOrder.order_status || providerOrder.orderStatus ||
      // ... (14 fields total)
      'processing';
    
    // STEP 5: Map to local status
    const mappedStatus = mapProviderStatusToLocal(rawProviderStatus);
    
    // STEP 6: Check if changed
    const statusChanged = localOrder.status !== mappedStatus;
    const providerStatusChanged = localOrder.providerStatus !== rawProviderStatus;
    
    // STEP 7: Update database
    if (statusChanged || providerStatusChanged) {
      const updateFields = {
        status: mappedStatus,
        providerStatus: String(rawProviderStatus),
        updatedAt: new Date(),
        providerResponse: providerOrder,
      };
      
      const result = await db.collection('orders').updateOne({ _id: localOrder._id }, { $set: updateFields });
      
      // STEP 8: Verify update persisted
      const verifiedOrder = await db.collection('orders').findOne({ _id: localOrder._id });
    }
    
    // Return full trace to client
    res.json({ success: true, data: { /* ... */ } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Test trace failed', message: err.message });
  }
});
```

**Usage**:
```bash
curl -X POST http://localhost:3001/api/test/trace-order-sync/91703211
```

**Output**: 
- Console: Detailed step-by-step trace
- Response JSON: Result of each step

---

## MongoDB Update Queries Summary

### Query 1: Background Push Update (Line 2383)
```javascript
db.collection('orders').updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      providerOrderId: "91703211",
      externalId: "91703211",
      providerResponse: { status: "In progress", ... },
      status: "processing",
      providerStatus: "In progress",                    // ← Key change
      updatedAt: ISODate("2026-06-11T...")
    }
  }
)
```

### Query 2: Bulk Sync Update (reconcileProviderOrders)
```javascript
// Protected - only updates if NOT in final state
if (existing.status !== 'completed' && existing.status !== 'canceled' && 
    existing.status !== 'partial' && existing.status !== 'failed') {
  
  db.collection('orders').updateOne(
    { _id: ObjectId("...") },
    {
      $set: {
        status: "completed",
        providerStatus: "Completed",                    // ← Always set
        providerResponse: { ... },
        updatedAt: ISODate("...")
      }
    }
  )
}
```

### Query 3: Single-Order Refresh Update (Line ~1153)
```javascript
// Protected - refuses to downgrade from final states
if (!finalStatuses.includes(order.status)) {
  db.collection('orders').updateOne(
    { _id: ObjectId("...") },
    {
      $set: {
        status: "completed",
        providerStatus: "Completed",                    // ← Always set
        providerResponse: { status: "Completed", ... },
        startCount: 100,
        remains: 50,
        updatedAt: ISODate("...")
      }
    }
  )
}
```

---

## Fields Always Updated Together

When `status` changes, these fields are ALWAYS set in same update:

```javascript
$set: {
  status: mappedStatus,                   // ← Always
  providerStatus: String(rawProviderStatus), // ← Always (FIX)
  providerResponse: prow,                 // ← Always
  updatedAt: new Date(),                  // ← Always
  // Optional fields if present:
  startCount: Number(...),
  remains: Number(...),
  amount: Number(...),
  providerCancelable: Boolean(...),
  providerRefillable: Boolean(...),
}
```

---

## Protection Logic

```javascript
const finalStatuses = ['completed', 'canceled', 'partial', 'failed'];

// Check 1: Don't downgrade
const currentStatusIsFinal = finalStatuses.includes(String(existing.status || '').toLowerCase());
if (currentStatusIsFinal) {
  skip_update();  // ← Don't change it
}

// Check 2: Map consistently
const mappedStatus = mapProviderStatusToLocal(rawProviderStatus);
// This handles: "Completed" → "completed", "In Progress" → "processing", etc.
```

---

## Key Improvements

| Before | After |
|--------|-------|
| `providerStatus` undefined on creation | Always initialized with raw provider status |
| Completed orders could be reset to "processing" | Protected: final statuses never downgrade |
| `mapUserOrderRow` read stale nested status | Now reads root `doc.providerStatus` first |
| No way to trace stuck orders | Test endpoint traces complete flow |
| Inconsistent logging | Standardized `[ORDER-CREATE-PUSH]`, `[BULK-SYNC]`, `[PROVIDER-SYNC-TRACE]` |
