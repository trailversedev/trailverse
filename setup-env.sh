#!/bin/bash

echo "⚙️ Setting up Trailverse environment files..."

# Create root .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created root .env file"
else
  echo "ℹ️  Root .env file already exists"
fi

# Create client .env
if [ ! -f client/.env ]; then
  cp client/.env.example client/.env
  echo "✅ Created client .env file"
else
  echo "ℹ️  Client .env file already exists"
fi

# Create server .env
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "✅ Created server .env file"
else
  echo "ℹ️  Server .env file already exists"
fi

# Create server .env.test
cat > server/.env.test << 'ENVEOF'
NODE_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/trailverse_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret-for-testing-only
SUPPRESS_TEST_LOGS=true
ENVEOF

echo "✅ Created server test environment file"

echo ""
echo "🎯 Environment files created! Remember to:"
echo "1. Add your actual API keys to the .env files"
echo "2. Update database URLs if using different credentials"
echo "3. Keep .env files secure and never commit them to git"
