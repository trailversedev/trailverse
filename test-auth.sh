#!/bin/bash

echo "🧪 Testing Trailverse Authentication System..."

BASE_URL="http://localhost:5001"

# Test health endpoint
echo "📊 Testing health endpoint..."
curl -s "${BASE_URL}/health" | jq .

echo -e "\n🔐 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@trailverse.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }')

echo "$REGISTER_RESPONSE" | jq .

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken')

echo -e "\n👤 Testing authenticated user info..."
curl -s "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo -e "\n🚪 Testing login..."
curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@trailverse.com",
    "password": "SecurePass123!"
  }' | jq .

echo -e "\n✅ Authentication tests completed!"
