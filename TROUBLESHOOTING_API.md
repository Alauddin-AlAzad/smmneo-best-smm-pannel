# API Not Fetching - Troubleshooting Guide

## 🔍 Diagnosis Steps (Do These First)

### Step 1: Check Browser Console
1. Open browser (Chrome/Firefox)
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Look for messages starting with 📡, 🔄, ✅, or ❌
5. Share the console output with debug logs

### Step 2: Check Network Tab
1. Open DevTools → **Network** tab
2. Refresh page or navigate to Services
3. Look for API calls to `localhost:3000`
4. Click on the `/api/services` request
5. Check:
   - **Status:** Should be `200` (green)
   - **Response:** Should show JSON data
   - **Request URL:** Should be `http://localhost:3000/api/services?page=1&limit=50`

### Step 3: Verify Servers Running
```bash
# Check Backend
curl http://localhost:3000/health
# Should return: {"status":"ok","message":"Server is healthy"}

# Check if services exist
curl http://localhost:3000/api/services?page=1&limit=5
# Should return paginated data
```

---

## 🐛 Common Issues & Fixes

### ❌ Issue: Connection Refused (Backend Not Running)

**Error in Console:**
```
❌ Fetch Error: Network Error
message: "Connect ECONNREFUSED 127.0.0.1:3000"
```

**Solution:**
```bash
cd smmneo-server
npm run dev
# Wait for: ✅ Server running on http://localhost:3000
```

---

### ❌ Issue: MongoDB Error (Database Not Running)

**Error in Console:**
```
❌ MongoDB Connection Error: Failed to connect to MongoDB
```

**Solution:**

**Windows:**
```bash
mongod
# Should show: Waiting for connections on port 27017
```

**macOS (via Homebrew):**
```bash
brew services start mongodb-community
# Should show: Service `mongodb-community` started
```

**Linux (Ubuntu):**
```bash
sudo systemctl start mongod
systemctl status mongod
```

**Test connection:**
```bash
mongosh
# Should connect and show MongoDB version
```

---

### ❌ Issue: No Data (Database Empty)

**Error in Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "totalItems": 0,
    "totalPages": 0
  }
}
```

**Solution:**
```bash
cd smmneo-server
node seed.js
# Should show: ✅ Inserted 8000 services into database
```

---

### ❌ Issue: 404 Error (API Endpoint Not Found)

**Error in Console:**
```
❌ Fetch Error: 404 Not Found
```

**Solution:**
Check that `routes/services.js` is correctly integrated in `index.js`:

```javascript
// index.js should have:
const servicesRouter = require('./routes/services.js');
app.use('/api/services', servicesRouter);
```

Restart backend:
```bash
npm run dev
```

---

### ❌ Issue: 500 Error (Server Error)

**Error in Console:**
```
❌ Fetch Error: 500 Internal Server Error
```

**Solution:**
1. Check backend terminal for error message
2. Ensure `.env` file has correct values:
   ```env
   DB_USER=smmneo
   DB_PASS=smmneo123
   DB_HOST=localhost
   DB_PORT=27017
   PORT=3000
   ```
3. Restart MongoDB and backend

---

## 🔧 Manual Testing

### Test 1: Backend Health
```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{"status":"ok","message":"Server is healthy"}
```

### Test 2: Get Services
```bash
curl "http://localhost:3000/api/services?page=1&limit=5"
```

Expected Response:
```json
{
  "success": true,
  "data": [...5 services...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 160,
    "totalItems": 8000,
    "itemsPerPage": 50,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Test 3: Search
```bash
curl "http://localhost:3000/api/services?page=1&limit=10&search=instagram"
```

Should return filtered results.

---

## 🚀 Complete Setup (From Scratch)

If nothing works, follow this exact sequence:

### Terminal 1 - MongoDB
```bash
mongod
# Should show: Waiting for connections on port 27017
```

### Terminal 2 - Backend
```bash
cd /e/smmneo/smmneo-server
npm install
node seed.js
# Should show: ✅ Inserted 8000 services
npm run dev
# Should show: ✅ Server running on http://localhost:3000
```

### Terminal 3 - Frontend
```bash
cd /e/smmneo/smmneo-client
npm install
npm run dev
# Should show: ✅ Local:   http://localhost:5173
```

### Browser
```
Visit: http://localhost:5173/admin/services
Should see services loading...
```

---

## 📋 Verification Checklist

- [ ] MongoDB running (`mongod` process visible)
- [ ] Backend running (`npm run dev` on :3000)
- [ ] Frontend running (`npm run dev` on :5173)
- [ ] Database seeded (`node seed.js` ran successfully)
- [ ] `http://localhost:3000/health` returns 200
- [ ] `http://localhost:3000/api/services?page=1&limit=5` returns JSON
- [ ] Browser console shows `📡 API Base URL: http://localhost:3000/api`
- [ ] Services page shows loading then data
- [ ] No errors in browser console
- [ ] No errors in backend terminal

---

## 🆘 Still Not Working?

Please provide:

1. **Backend Terminal Output:**
   ```bash
   npm run dev
   # Copy the startup message
   ```

2. **Browser Console Logs:**
   - Press F12 → Console
   - Look for messages with 📡, 🔄, ✅, ❌
   - Copy everything

3. **Network Tab:**
   - F12 → Network
   - Refresh page
   - Click `/api/services` request
   - Screenshot or copy the request/response

4. **MongoDB Check:**
   ```bash
   mongosh
   use smmneo
   db.services.countDocuments()
   # Should return: 8000
   ```

5. **Which step fails:**
   - Backend starts? YES / NO
   - API responds? YES / NO
   - Frontend loads? YES / NO
   - Data shows? YES / NO

---

## 🎯 Quick Fix Checklist

1. **Restart everything** (common fix!)
   ```bash
   # Kill all processes and restart
   mongod &
   cd smmneo-server && npm run dev &
   cd smmneo-client && npm run dev
   ```

2. **Check all 3 terminals**
   - Terminal 1: MongoDB ✓
   - Terminal 2: Backend ✓
   - Terminal 3: Frontend ✓

3. **Clear cache**
   ```bash
   # Browser cache
   F12 → Application → Clear Storage
   
   # NPM cache
   npm cache clean --force
   npm install
   ```

4. **Check environment**
   - Windows vs macOS vs Linux
   - Python available? (for some npm packages)
   - Node version: `node --version` (should be 18+)

---

## 💬 Ask for Help

If still stuck, tell me:
1. **What you see on screen** (blank? error? loading?)
2. **Browser console errors** (paste them)
3. **Backend console output** (paste startup + any errors)
4. **Which server is running** (backend? MongoDB? both?)

I'll help you fix it! 🚀
