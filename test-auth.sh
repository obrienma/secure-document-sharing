#!/bin/bash

echo "🧪 Testing DocShare Auth API"
echo "=============================="
echo ""

# Test 1: Register
echo "📝 Test 1: Register new user"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser'$(date +%s)'@example.com",
    "password": "testpass123",
    "fullName": "Test User"
  }')
echo "$REGISTER_RESPONSE" | grep -q "token" && echo "✓ Registration successful" || echo "✗ Registration failed"
echo ""

# Test 2: Login
echo "🔐 Test 2: Login existing user"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amanda@test.com",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | grep -q "token" && echo "✓ Login successful" || echo "✗ Login failed"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""

# Test 3: Get current user
echo "👤 Test 3: Get current user (protected route)"
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/me)
echo "$ME_RESPONSE" | grep -q "amanda@test.com" && echo "✓ Protected route works" || echo "✗ Protected route failed"
echo ""

# Test 4: Invalid credentials
echo "🚫 Test 4: Login with wrong password"
WRONG_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amanda@test.com",
    "password": "wrongpassword"
  }')
echo "$WRONG_RESPONSE" | grep -q "Invalid credentials" && echo "✓ Invalid credentials rejected" || echo "✗ Should reject wrong password"
echo ""

# Test 5: Validation
echo "✅ Test 5: Validation checks"
VALIDATION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bademail",
    "password": "123",
    "fullName": "X"
  }')
echo "$VALIDATION_RESPONSE" | grep -q "Validation failed" && echo "✓ Validation works" || echo "✗ Validation should fail"
echo ""

# Test 6: No token
echo "🔒 Test 6: Protected route without token"
NO_TOKEN_RESPONSE=$(curl -s http://localhost:3001/api/auth/me)
echo "$NO_TOKEN_RESPONSE" | grep -q "No token provided" && echo "✓ Rejects missing token" || echo "✗ Should require token"
echo ""

echo "=============================="
echo "✨ All tests complete!"
