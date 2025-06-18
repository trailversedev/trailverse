#!/bin/bash

# =================================================================
# TRAILVERSE SERVER .ENV UPDATE SCRIPT
# =================================================================

echo "🔧 Updating server/.env file with production-ready configuration..."

cd server

# Backup existing .env file
if [ -f .env ]; then
    cp .env .env.backup
    echo "📋 Backed up existing .env to .env.backup"
fi

# Create the comprehensive .env file
cat > .env << 'EOF'
# =================================================================
# TRAILVERSE SERVER ENVIRONMENT CONFIGURATION
# =================================================================

# Application Settings
NODE_ENV=development
PORT=5000
APP_NAME="Trailverse"
API_VERSION="v1"

# =================================================================
# DATABASE CONFIGURATION
# =================================================================

# PostgreSQL Database (Docker container)
DATABASE_URL=postgresql://postgres:postgres@trailverse-postgres:5432/trailverse

# Database Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000

# =================================================================
# REDIS CONFIGURATION
# =================================================================

# Redis Cache (Docker container)
REDIS_URL=redis://trailverse-redis:6379
REDIS_HOST=trailverse-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=trailverse:

# Redis Connection Settings
REDIS_RETRY_DELAY=100
REDIS_MAX_RETRIES=3
REDIS_KEEP_ALIVE=30000

# =================================================================
# AUTHENTICATION & SECURITY
# =================================================================

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=trailverse-super-secret-jwt-key-32-chars-minimum-dev-only-2024
JWT_REFRESH_SECRET=trailverse-different-refresh-secret-32-chars-minimum-dev-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=trailverse-session-secret-change-in-production-2024

# Password Security
BCRYPT_ROUNDS=12

# Security Options
BYPASS_AUTH=false
STRICT_SESSION_IP=false
ENABLE_CSRF=true

# =================================================================
# RATE LIMITING CONFIGURATION
# =================================================================

# General API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Authentication Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=10

# User-specific Rate Limiting
USER_RATE_LIMIT_WINDOW_MS=3600000
USER_RATE_LIMIT_MAX_REQUESTS=1000

# =================================================================
# CORS CONFIGURATION
# =================================================================

# CORS Settings
CORS_ORIGIN=http://localhost:3000
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-CSRF-Token,X-API-Key

# =================================================================
# EXTERNAL API KEYS (Add your keys here)
# =================================================================

# Maps & Location Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
MAPBOX_API_KEY=your-mapbox-api-key
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# Weather Services
OPENWEATHER_API_KEY=your-openweather-api-key
WEATHERAPI_KEY=your-weatherapi-key

# National Park Service
NPS_API_KEY=your-national-park-service-api-key

# =================================================================
# FILE UPLOAD & STORAGE
# =================================================================

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=trailverse-media

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,video/mp4

# =================================================================
# EMAIL CONFIGURATION
# =================================================================

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-app-password
FROM_EMAIL=noreply@trailverse.app
FROM_NAME="Trailverse Team"

# SendGrid Alternative
SENDGRID_API_KEY=your-sendgrid-api-key

# =================================================================
# AI/ML SERVICES
# =================================================================

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id

# Other AI Services
HUGGINGFACE_API_KEY=your-huggingface-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# =================================================================
# SOCIAL AUTHENTICATION
# =================================================================

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_PRIVATE_KEY=your-apple-private-key

# =================================================================
# PUSH NOTIFICATIONS
# =================================================================

# Firebase Configuration
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project-id

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token

# =================================================================
# PAYMENT PROCESSING
# =================================================================

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# =================================================================
# MONITORING & LOGGING
# =================================================================

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=combined
ENABLE_REQUEST_LOGGING=true

# Error Reporting
SENTRY_DSN=your-sentry-dsn

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-id

# =================================================================
# DEVELOPMENT & TESTING
# =================================================================

# Development Settings
ENABLE_PLAYGROUND=true
ENABLE_INTROSPECTION=true
ENABLE_DEBUG_LOGGING=true

# Testing Settings
TEST_DATABASE_URL=postgresql://postgres:postgres@trailverse-postgres:5432/trailverse_test
TEST_REDIS_URL=redis://trailverse-redis:6379/1

# =================================================================
# FEATURE FLAGS
# =================================================================

# Feature Toggles
ENABLE_AI_FEATURES=true
ENABLE_AR_FEATURES=false
ENABLE_VOICE_FEATURES=false
ENABLE_SOCIAL_FEATURES=true
ENABLE_PREMIUM_FEATURES=true

# =================================================================
# SECURITY HEADERS & MISC
# =================================================================

# Security Headers
HELMET_ENABLED=true
TRUST_PROXY=false

# Miscellaneous
TZ=UTC
LOCALE=en-US
EOF

echo "✅ Successfully updated server/.env file!"
echo ""
echo "📋 Key changes made:"
echo "   ✓ Kept your Docker container URLs (trailverse-postgres, trailverse-redis)"
echo "   ✓ Added comprehensive JWT configuration with separate access/refresh secrets"
echo "   ✓ Added Redis configuration with connection settings"
echo "   ✓ Added rate limiting configuration"
echo "   ✓ Added CORS settings for frontend communication"
echo "   ✓ Added security headers configuration"
echo "   ✓ Added placeholder sections for external APIs"
echo "   ✓ Added development and feature flag settings"
echo ""
echo "🔒 SECURITY NOTE:"
echo "   The JWT secrets are for DEVELOPMENT ONLY!"
echo "   Generate new secrets for production using:"
echo "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""
echo "🗂️ Backup created: server/.env.backup"
