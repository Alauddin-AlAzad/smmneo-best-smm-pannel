# Provider Backend Integration - Quick Start Guide

## Prerequisites
- Node.js running on backend (port 3001)
- MongoDB connected and running
- React development server running

## Step 1: Verify Backend is Ready

Check that the backend server is running:
```bash
cd smmneo-server
npm install  # if needed
npm start
```

You should see: `Connected to MongoDB` and `Server running on port 3001`

## Step 2: Verify Database Indexes

The database indexes are created automatically on first route access. To manually initialize:
```bash
# On backend startup, indexes are created when first GET request hits /api/providers
```

## Step 3: Test Provider API Endpoints

### Using cURL or Postman:

**Get All Providers (Should be empty initially)**
```bash
GET http://localhost:3001/api/providers
```
Response: `{ "success": true, "data": [], "count": 0 }`

**Create a Provider**
```bash
POST http://localhost:3001/api/providers
Content-Type: application/json

{
  "name": "Test Provider",
  "apiUrl": "https://api.testprovider.com",
  "apiKey": "test-key-12345",
  "disableSync": false,
  "loginUsername": "testuser",
  "loginPassword": "testpass"
}
```

Response will include an `id` field - save this for next steps.

**Get All Providers (Should show 1 now)**
```bash
GET http://localhost:3001/api/providers
```

**Update Provider**
```bash
PUT http://localhost:3001/api/providers/{id}
Content-Type: application/json

{
  "name": "Updated Provider Name",
  "disableSync": true
}
```

**Delete Provider**
```bash
DELETE http://localhost:3001/api/providers/{id}
```

## Step 4: Test via Frontend UI

### In Settings Page:
1. Navigate to **Settings → Sellers Settings** (👥 icon)
2. Click **+ Add New Provider**
3. Fill in form:
   - API URL: `https://api.example.com`
   - API Key: `your-api-key`
   - Leave other fields blank (optional)
4. Click **Add Provider**
5. Provider should appear in the list below

### Test Persistence:
1. Refresh the page (F5 or Ctrl+R)
2. Provider should still be visible
3. Go to another page and back
4. Provider data persists

### Test Edit:
1. Click **Edit** on a provider
2. Change any field
3. Click **Update Provider**
4. Changes are saved

### Test Delete:
1. Click **Delete** on a provider
2. Confirm deletion
3. Provider removed from list

## Step 5: Test Cross-Browser/Device Sync

**Setup:**
- Open App URL in Browser A
- Open App URL in different Browser (B) or Device

**Test Sequence:**

1. **Add in Browser A**
   - Go to Settings → Sellers Settings
   - Add a new provider
   - Note the timestamp (current time)

2. **Check Browser B**
   - Refresh page (F5)
   - Go to Settings → Sellers Settings
   - New provider from Browser A should appear

3. **Edit in Browser A**
   - Click Edit on the provider
   - Change "Disable Sync" to "Yes"
   - Click Update

4. **Check Browser B**
   - Refresh page
   - Changes from Browser A should be visible
   - "Sync Disabled" status should show red badge

5. **Delete in Browser A**
   - Delete the provider
   - Confirm deletion

6. **Check Browser B**
   - Refresh page
   - Provider should be completely gone

## Step 6: Verify Services Tab Uses Providers

1. Go to **Dashboard → Services** (🛍️ tab)
2. Should show **Provider Selector** dropdown
3. Dropdown should list all providers from database
4. Select a provider
5. Services load from that provider
6. Verify provider selection persists across pages

## Troubleshooting

### "Failed to fetch providers" Error
- ✅ Check backend is running on port 3001
- ✅ Check MongoDB is connected
- ✅ Check network tab in DevTools for 404/500 errors
- ✅ Look at backend console for error messages

### Providers Not Appearing
- ✅ Backend might not have started with fresh database
- ✅ Check MongoDB connection string in `db.js`
- ✅ Verify ports: Frontend (5173), Backend (3001)
- ✅ Clear browser cache and refresh

### Provider Data Lost After Refresh
- ✅ This should NOT happen with new code
- ✅ If it does, backend might not be running
- ✅ Check browser DevTools Network tab - should see GET /api/providers requests
- ✅ Check backend console for errors

### Providers Not Syncing Across Browsers
- ✅ Make sure both browsers access the same backend (localhost:3001)
- ✅ Refresh the page to fetch latest data
- ✅ Check Network tab to see if API calls succeed
- ✅ Backend should have console logs like: "GET /api/providers - 200"

## Important Notes

1. **All provider data is now in MongoDB** - Not in localStorage
2. **IDs are MongoDB ObjectIDs** - Longer strings like "507f1f77bcf86cd799439011"
3. **Data persists across**:
   - Page refreshes
   - Browser restarts
   - Different devices
   - Different browsers
4. **API is RESTful** - Follows standard HTTP conventions
5. **Frontend fetches on mount** - Providers loaded immediately on page open

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/providers` | Get all providers |
| GET | `/api/providers/:id` | Get single provider |
| GET | `/api/providers/active` | Get only active providers |
| POST | `/api/providers` | Create new provider |
| PUT | `/api/providers/:id` | Update provider |
| DELETE | `/api/providers/:id` | Delete provider |

## Next Steps

Once verified:
1. ✅ Providers persist in database
2. ✅ Cross-browser sync works
3. ✅ No data loss on refresh
4. ✅ Add/Edit/Delete operations work

You can:
- Deploy to production
- Remove any remaining localStorage references if needed
- Add provider groups/categories
- Implement provider analytics
