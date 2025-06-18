# Optimized Server Dockerfile for ES Modules
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for some npm packages
RUN apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    make \
    g++

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema (needed for generation)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Create dist directory for TypeScript builds
RUN mkdir -p dist

# Expose ports
EXPOSE 5000 5555

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Default command (development mode)
CMD ["npm", "run", "dev"]
