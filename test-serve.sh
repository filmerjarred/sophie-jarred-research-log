#!/bin/bash
node serve.js &
PID=$!
sleep 2

echo "=== Root test ==="
curl -s -k https://localhost:3000/ | head -3

echo ""
echo "=== Redirect test (day-3 without slash) ==="
curl -s -k -I https://localhost:3000/ship-december/day-3 | head -3

echo ""
echo "=== With trailing slash ==="
curl -s -k https://localhost:3000/ship-december/day-3/ | head -3

kill $PID
