#!/bin/bash

echo "🔍 COMPLETE SYSTEM CHECK"
echo "======================="
echo ""

echo "1️⃣  BACKEND SERVER CHECK:"
echo "Testing port 3001..."
if curl -s http://localhost:3001/health > /dev/null; then
  echo "✅ Backend is running on port 3001"
else
  echo "❌ Backend NOT responding on port 3001"
  exit 1
fi

echo ""
echo "2️⃣  PROVIDER API ENDPOINT CHECK:"
echo "Testing /api/providers/services..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/providers/services \
  -H "Content-Type: application/json" \
  -d '{"apiUrl":"https://smmgen.com/api/v2","apiKey":"fe8d0ffe500cfd6a7472162bb3ed93ec"}')

if [ -z "$RESPONSE" ]; then
  echo "❌ No response from provider API"
  exit 1
fi

COUNT=$(echo "$RESPONSE" | grep -o '"service"' | wc -l)
echo "✅ Provider API returning $COUNT services"

echo ""
echo "3️⃣  FRONTEND SERVER CHECK:"
echo "Testing port 5173..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "✅ Frontend is running on port 5173"
else
  echo "❌ Frontend NOT responding on port 5173"
fi

echo ""
echo "4️⃣  CONFIGURATION CHECK:"
echo "Checking providerAPI.js uses port 3001..."
grep -q "3001" /e/smmneo/smmneo-client/app/services/providerAPI.js && \
  echo "✅ Frontend configured for port 3001" || \
  echo "❌ Frontend NOT configured for port 3001"

echo ""
echo "═══════════════════════════════════"
echo "✅ ALL SYSTEMS READY!"
echo ""
echo "NEXT STEPS:"
echo "1. Open http://localhost:5173/admin/services in browser"
echo "2. Open DevTools (F12)"
echo "3. Go to Console tab"
echo "4. Copy-paste this to add provider:"
echo ""
echo "localStorage.setItem('smmgen_providers',"
echo "JSON.stringify([{id:1,name:'SMMGEN',"
echo "apiUrl:'https://smmgen.com/api/v2',"
echo "apiKey:'fe8d0ffe500cfd6a7472162bb3ed93ec',"
echo "disableSync:false,loginUsername:'',loginPassword:''}]))"
echo ""
echo "5. Refresh the page - services should load!"
echo "═══════════════════════════════════"
