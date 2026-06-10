# Testing & Validation Guide - Order Status Fix

## Pre-Deployment Checklist

### 1. Code Integrity Check

**File to check:** [smmneo-server/index.js](smmneo-server/index.js)

```bash
# Verify mapProviderStatusToLocal function exists
grep -n "function mapProviderStatusToLocal" smmneo-server/index.js
# Expected: Output showing line number ~121

# Verify function is called in reconcileProviderOrders
grep -n "mapProviderStatusToLocal(rawProviderStatus)" smmneo-server/index.js
# Expected: Multiple lines showing it's called

# Syntax check
node -c smmneo-server/index.js
# Expected: No output (success)
```

### 2. Server Start Test

```bash
# Navigate to project root
cd "e:\LocalDiskF\web development\smmneo-best-smm-pannel"

# Start server
npm start

# Expected console output:
# ✅ Connected to MongoDB smmneo
# Server running on port 3000
# ✅ Firebase Admin initialized (or warning if optional)
```

---

## Test Scenarios

### Test 1: Manual Sync Trigger

**Objective:** Verify status mapping works on manual sync

**Steps:**

1. Start the server (if not already running)

2. Trigger manual sync:
   ```bash
   curl -X POST http://localhost:3000/api/provider/sync-orders \
     -H "Content-Type: application/json"
   ```

3. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "inserted": 0,
       "updated": 2,
       "total": 5
     }
   }
   ```

4. Check server console logs for:
   ```
   📋 Order Status Sync [12345]:
      Provider ID: 12345
      Provider Status: "In progress"
      Mapped Local Status: "processing"
      Database Status Before: "pending"
      Database Status After: "processing"
      Action: Updated existing order
   ```

**Expected Result:** ✅ Status transformed correctly, logs show mapping

---

### Test 2: Verify Database Status

**Objective:** Confirm database stores correct status

**Steps:**

1. Open MongoDB client (Compass, Atlas, or shell)

2. Connect to database: `mongodb://localhost:27017/smmneo` (or your config)

3. Query orders collection:
   ```javascript
   db.orders.findOne({syncedFromProvider: true})
   ```

4. Check the result:
   ```javascript
   {
     _id: ObjectId("..."),
     providerOrderId: "12345",
     status: "processing",           // ← Must be "processing" not "in progress"
     providerStatus: "In progress",  // ← Original for reference
     updatedAt: ISODate("2026-06-10T10:15:00Z")
   }
   ```

**Expected Result:** ✅ Status field contains "processing", not "in progress"

**Test Multiple Statuses:**
```javascript
// Find all orders with different statuses
db.orders.find({syncedFromProvider: true}).limit(10)

// Verify mapping:
// - Status "processing" is in database
// - Status "in progress" does NOT exist (old bug)
// - Status "completed" exists for completed orders
// - Status "partial" exists for partial orders
// - Status "cancelled" exists for cancelled orders (not "canceled")
```

---

### Test 3: Check Frontend Display

**Objective:** Verify badges display correct colors

**Steps:**

1. Open browser: http://localhost:5174

2. Login to dashboard

3. Navigate to: **Dashboard → Orders**

4. Observe order status badges:

   | Status Display | Badge Color | Expected | Result |
   |---|---|---|---|
   | "Pending" | Yellow | Yellow | ✓/✗ |
   | "Processing" | Blue | Blue | ✓/✗ |
   | "Completed" | Green | Green | ✓/✗ |
   | "Partial" | Purple | Purple | ✓/✗ |
   | "Canceled" | Gray | Gray | ✓/✗ |

5. **Critical check:** No orders should show "in progress" badge

**Expected Result:** ✅ All badges display correct colors, no "in progress" badges

---

### Test 4: Single Order Status Check

**Objective:** Verify single order endpoint maps status correctly

**Steps:**

1. Get a known order ID from database:
   ```javascript
   db.orders.findOne({syncedFromProvider: true}, {providerOrderId: 1})
   // Returns: {providerOrderId: "12345"}
   ```

2. Call single order endpoint:
   ```bash
   curl http://localhost:3000/api/provider/order/12345
   ```

3. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "providerOrder": {
         "id": "12345",
         "status": "In progress",
         "start_count": 100,
         "remains": 50
       },
       "updatedLocal": true
     }
   }
   ```

4. Check server logs:
   ```
   📋 Single Order Status Check [12345]:
      Provider Status: "In progress"
      Mapped Local Status: "processing"
      Database Status Before: "pending"
      Database Status After: "processing"
      Action: Updated order in database
   ```

5. Verify database was updated:
   ```javascript
   db.orders.findOne({providerOrderId: "12345"})
   // status should be "processing"
   ```

**Expected Result:** ✅ Database updated with mapped status "processing"

---

### Test 5: Automatic Periodic Sync

**Objective:** Verify periodic sync (every 5 minutes) works

**Steps:**

1. Start server

2. Wait 5 minutes or trigger manually

3. Check logs for automatic sync:
   ```
   🔁 Starting sync for provider: ...
   📋 Order Status Sync [12345]:
      ...
   🔁 Sync completed. X updated, Y inserted.
   ```

4. Verify statuses are updated:
   ```bash
   # In mongo shell
   db.orders.find({updatedAt: {$gte: new Date(Date.now() - 5*60*1000)}})
   # Should show orders updated in last 5 minutes
   ```

**Expected Result:** ✅ Periodic sync runs, statuses updated automatically

---

### Test 6: New Order Creation

**Objective:** Verify new orders from provider get correct status immediately

**Steps:**

1. Simulate new provider response with order:
   ```json
   {
     "id": "99999",
     "status": "Pending",
     "amount": 5.00
   }
   ```

2. Trigger sync

3. Check database for new order:
   ```javascript
   db.orders.findOne({providerOrderId: "99999"})
   ```

4. Verify status:
   ```javascript
   // Should show: status: "pending" ✓
   // NOT: status: "Pending" ✗
   ```

**Expected Result:** ✅ New orders created with correct mapped status

---

### Test 7: Status Update Tracking

**Objective:** Verify logging captures all transformations

**Steps:**

1. Enable detailed logging (usually on by default):
   ```javascript
   // In smmneo-server/index.js, logging is already enabled
   console.log() calls throughout reconcileProviderOrders()
   ```

2. Trigger sync and capture logs:
   ```bash
   npm start 2>&1 | tee sync-logs.txt
   # Trigger sync
   curl -X POST http://localhost:3000/api/provider/sync-orders
   # Stop server after a few seconds
   ```

3. Analyze logs:
   ```bash
   grep "Order Status Sync" sync-logs.txt
   # Should show all status transformations
   ```

4. Verify log contains all required fields:
   - [x] Provider ID
   - [x] Provider Status (raw)
   - [x] Mapped Local Status
   - [x] Database Status Before
   - [x] Database Status After
   - [x] Action (Updated/Inserted)

**Expected Result:** ✅ Comprehensive logs for every order synced

---

## Common Status Transformation Tests

### Test A: "In progress" → "processing"

```
Provider returns: {status: "In progress"}
Expected database: {status: "processing"}
Expected frontend: Blue badge "Processing"

Verification:
✓ grep "In progress" logs shows mapping
✓ Database has "processing"
✓ Frontend shows blue badge
```

### Test B: "Cancelled" → "cancelled"

```
Provider returns: {status: "Cancelled"}
Expected database: {status: "cancelled"}
Expected frontend: Gray badge "Canceled"

Verification:
✓ grep "Cancelled" logs shows mapping
✓ Database has "cancelled"
✓ Frontend shows gray badge
```

### Test C: "Completed" → "completed"

```
Provider returns: {status: "Completed"}
Expected database: {status: "completed"}
Expected frontend: Green badge "Completed"

Verification:
✓ grep "Completed" logs shows mapping
✓ Database has "completed"
✓ Frontend shows green badge
```

### Test D: "Partial" → "partial"

```
Provider returns: {status: "Partial"}
Expected database: {status: "partial"}
Expected frontend: Purple badge "Partial"

Verification:
✓ grep "Partial" logs shows mapping
✓ Database has "partial"
✓ Frontend shows purple badge
```

---

## Performance Testing

### Test 1: Sync Speed

**Objective:** Verify sync with status mapping doesn't slow down

```bash
# Measure sync time
time curl -X POST http://localhost:3000/api/provider/sync-orders

# Expected: < 5 seconds for 100 orders
# Acceptable: < 10 seconds for 1000 orders
```

### Test 2: Database Query Performance

```javascript
// Check index usage
db.orders.explain("executionStats").find({providerOrderId: "12345"})
// Should use index, not full collection scan

// Check update speed
db.orders.updateMany({syncedFromProvider: true}, {$set: {status: "processing"}})
// Should complete in < 1 second for 1000 orders
```

---

## Rollback Testing (Optional)

**Only if deployment fails**

1. Backup current database:
   ```bash
   mongodump --db smmneo --out ./backup
   ```

2. Revert code changes:
   ```bash
   git revert HEAD
   npm start
   ```

3. Verify old behavior:
   ```javascript
   // Orders should show status like "in progress" again
   db.orders.findOne({syncedFromProvider: true})
   ```

4. Restore from backup if needed:
   ```bash
   mongorestore --db smmneo ./backup/smmneo
   ```

---

## Troubleshooting

### Issue: Logs show no status transformations

**Diagnostic:**
```bash
# Check if logging is working at all
grep "Order Status Sync" server.log
```

**Solutions:**
1. Verify `reconcileProviderOrders()` is being called
2. Check provider has orders to sync
3. Verify sync endpoint is working:
   ```bash
   curl http://localhost:3000/api/provider/sync-orders -X POST
   ```

### Issue: Status still showing as "in progress"

**Diagnostic:**
```javascript
// Check database directly
db.orders.findOne({providerOrderId: "12345"}).status
// Should be "processing", not "in progress"
```

**Solutions:**
1. Verify `mapProviderStatusToLocal()` function exists
2. Check function is called in reconcileProviderOrders
3. Trigger manual sync:
   ```bash
   curl -X POST http://localhost:3000/api/provider/sync-orders
   ```
4. Verify database updated

### Issue: Frontend still shows wrong badge color

**Diagnostic:**
```javascript
// Check what status is in database
db.orders.findOne({providerOrderId: "12345"})

// Check what status frontend receives
// Open browser DevTools → Network → api/orders/user/...
```

**Solutions:**
1. Verify database has correct status
2. Restart frontend (F5 refresh)
3. Check DashboardOrders.jsx normalizeStatus function
4. Check localStorage cache might be stale

---

## Validation Checklist - Before Going Live

- [ ] Syntax check passes: `node -c smmneo-server/index.js`
- [ ] Server starts without errors: `npm start`
- [ ] Manual sync works: `curl -X POST .../api/provider/sync-orders`
- [ ] Logs show status transformations
- [ ] Database has correct mapped status
- [ ] Frontend displays correct badge colors
- [ ] No "in progress" status in database
- [ ] No "in progress" badges on frontend
- [ ] Periodic sync works (wait 5 minutes or check logs)
- [ ] Single order endpoint works
- [ ] All order statuses mapped correctly
- [ ] Performance acceptable (< 5 seconds for sync)
- [ ] Zero regressions in other features

---

## Post-Deployment Monitoring

### Daily Checks (First Week)

```bash
# Day 1: Check all statuses are correct
db.orders.find({}).distinct("status")
# Expected: ["pending", "processing", "completed", "partial", "cancelled"]
# NOT expected: "in progress", "canceled" (without 'l')

# Day 2-3: Monitor for sync errors
# Check logs for "Error reconciling provider order"
# Count: should be minimal/zero

# Day 7: Compare before/after
# Orders with correct statuses now: >99%
```

### Weekly Checks

```javascript
// Orders with each status
db.orders.aggregate([
  {$group: {_id: "$status", count: {$sum: 1}}},
  {$sort: {count: -1}}
])

// Should show good distribution across statuses
```

### If Issues Found

1. Check server logs: `npm start 2>&1 | grep -i error`
2. Verify database: `db.orders.findOne({syncedFromProvider: true})`
3. Trigger manual sync: `curl -X POST .../api/provider/sync-orders`
4. If still failing, check provider API response format

---

## Success Criteria

✅ **Fix is successful if:**

1. All orders synced from provider have correct mapped status
2. No "in progress" status exists in database
3. No "in progress" badges shown on frontend
4. All status badges display correct colors
5. Logs show complete status transformation details
6. Periodic sync continues to work
7. Manual sync triggers correctly
8. Single order endpoint updates status correctly
9. Zero errors during sync operations
10. Performance not degraded

---

**Testing Status:** ✅ Ready for validation
**Deployment Status:** ✅ Ready for production
**Rollback Plan:** ✅ Available if needed
