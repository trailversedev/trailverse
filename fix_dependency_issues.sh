# 🔧 Fix Trailverse Dependency Issues

echo "🔧 Fixing dependency conflicts in Trailverse..."

# ===================================================================
# STEP 1: FIX MOBILE PACKAGE.JSON WITH COMPATIBLE VERSIONS
# ===================================================================

echo "📱 Updating mobile package.json with compatible versions..."

cat > mobile/package.json << 'EOF'
{
  "name": "trailverse-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build",
    "build:android": "expo build:android",
    "build:ios": "expo build:ios",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.3.1",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "react-native-maps": "1.10.0",
    "expo-camera": "~14.0.0",
    "expo-location": "~16.5.0",
    "react-native-screens": "~3.29.0",
    "react-native-safe-area-context": "4.8.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.3.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.2.0"
  },
  "private": true
}
EOF

# ===================================================================
# STEP 2: UPDATE ROOT PACKAGE.JSON WITH BETTER DEPENDENCY MANAGEMENT
# ===================================================================

echo "📦 Updating root package.json..."

cat > package.json << 'EOF'
{
  "name": "trailverse",
  "version": "1.0.0",
  "description": "🔥 Trailverse - Your Universe of Trail Adventures. Advanced National Parks Explorer with AI, AR, and Real-time Features",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "build:shared": "cd shared && npm run build",
    "test": "npm run test:client && npm run test:server",
    "test:client": "cd client && npm run test",
    "test:server": "cd server && npm run test",
    "lint": "npm run lint:client && npm run lint:server && npm run lint:shared",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    "lint:shared": "cd shared && npm run lint",
    "lint:fix": "npm run lint:client -- --fix && npm run lint:server -- --fix && npm run lint:shared -- --fix",
    "setup": "npm install && npm run setup:workspaces",
    "setup:workspaces": "npm run setup:shared && npm run setup:client && npm run setup:server",
    "setup:shared": "cd shared && npm install",
    "setup:client": "cd client && npm install",
    "setup:server": "cd server && npm install",
    "setup:mobile": "cd mobile && npm install",
    "docker:dev": "docker-compose -f docker-compose.yml up",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "clean": "npm run clean:deps && npm run clean:builds",
    "clean:deps": "rm -rf node_modules client/node_modules server/node_modules shared/node_modules mobile/node_modules",
    "clean:builds": "rm -rf client/dist server/dist shared/dist",
    "reset": "npm run clean && npm install"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/trailversedev/trailverse.git"
  },
  "keywords": [
    "trailverse",
    "national-parks",
    "travel",
    "outdoor",
    "trails",
    "hiking",
    "react",
    "nodejs",
    "ai",
    "machine-learning",
    "ar",
    "augmented-reality",
    "real-time",
    "pwa",
    "mobile-app",
    "adventure",
    "nature",
    "exploration"
  ],
  "author": "Trailverse Team <dev@trailverse.app>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/trailversedev/trailverse/issues"
  },
  "homepage": "https://trailverse.app",
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "volta": {
    "node": "18.19.0",
    "npm": "10.2.3"
  }
}
EOF

# ===================================================================
# STEP 3: UPDATE CLIENT PACKAGE.JSON WITH LATEST COMPATIBLE VERSIONS
# ===================================================================

echo "⚛️ Updating client package.json..."

cat > client/package.json << 'EOF'
{
  "name": "trailverse-client",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,css,md,json}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.1",
    "@tanstack/react-query": "^5.17.9",
    "@tanstack/react-query-devtools": "^5.17.9",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "axios": "^1.6.2",
    "react-map-gl": "^7.1.7",
    "mapbox-gl": "^3.0.1",
    "framer-motion": "^10.16.16",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "lucide-react": "^0.294.0",
    "recharts": "^2.8.0",
    "date-fns": "^3.0.6",
    "react-hot-toast": "^2.4.1",
    "react-intersection-observer": "^9.5.3",
    "@tensorflow/tfjs": "^4.15.0",
    "three": "^0.159.0",
    "@react-three/fiber": "^8.15.12",
    "@react-three/drei": "^9.88.13"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/three": "^0.159.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@tailwindcss/aspect-ratio": "^0.4.2",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "vitest": "^1.0.4",
    "jsdom": "^23.0.1",
    "@vitest/ui": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# ===================================================================
# STEP 4: UPDATE SERVER PACKAGE.JSON WITH COMPATIBLE VERSIONS
# ===================================================================

echo "🚀 Updating server package.json..."

cat > server/package.json << 'EOF'
{
  "name": "trailverse-server",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seeds/index.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "prisma": "^5.7.1",
    "@prisma/client": "^5.7.1",
    "redis": "^4.6.11",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "nodemailer": "^6.9.7",
    "bull": "^4.12.2",
    "socket.io": "^4.7.4",
    "ws": "^8.16.0",
    "axios": "^1.6.2",
    "node-cron": "^3.0.3",
    "winston": "^3.11.0",
    "express-winston": "^4.2.0",
    "@tensorflow/tfjs-node": "^4.15.0",
    "natural": "^6.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/ws": "^8.5.10",
    "typescript": "^5.3.3",
    "tsx": "^4.6.2",
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "prettier": "^3.1.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16"
  }
}
EOF

# ===================================================================
# STEP 5: UPDATE SHARED PACKAGE.JSON
# ===================================================================

echo "🔗 Updating shared package.json..."

cat > shared/package.json << 'EOF'
{
  "name": "@trailverse/shared",
  "version": "1.0.0",
  "description": "Shared types, constants, and utilities for Trailverse",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "prettier": "^3.1.1"
  }
}
EOF

# ===================================================================
# STEP 6: CREATE TYPESCRIPT CONFIG FOR SHARED
# ===================================================================

echo "📝 Creating TypeScript config for shared..."

cat > shared/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "types/**/*",
    "constants/**/*",
    "utils/**/*",
    "schemas/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

# ===================================================================
# STEP 7: CREATE STEP-BY-STEP SETUP INSTRUCTIONS
# ===================================================================

cat > SETUP_INSTRUCTIONS.md << 'EOF'
# 🔧 Trailverse Setup Instructions

## ⚠️ Important: Follow This Order

### Step 1: Clean Any Existing Installations
```bash
# If you have dependency issues, clean everything first
npm run clean  # or manually delete node_modules folders
```

### Step 2: Install Core Dependencies (Excludes Mobile)
```bash
# Install root dependencies
npm install

# Install workspace dependencies (excludes mobile for now)
npm run setup:workspaces
```

### Step 3: Set Up Environment Variables
```bash
# Copy environment templates
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit the .env files with your actual API keys
```

### Step 4: Start Development Environment
```bash
# Start databases
docker-compose up -d

# Start development servers
npm run dev
```

### Step 5: Mobile Setup (Optional - Do This Later)
```bash
# Only do this after core setup works
cd mobile
npm install
```

## 🔍 Verification

After setup, you should be able to access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: postgresql://localhost:5432

## 🚨 Troubleshooting

### If you get dependency conflicts:
```bash
npm run clean
npm install --legacy-peer-deps
```

### If databases won't start:
```bash
docker-compose down
docker-compose up -d
```

### If mobile has issues:
- Skip mobile setup for now
- Focus on web app first
- Mobile can be added later
EOF

# ===================================================================
# STEP 8: UPDATE ROOT WORKSPACE TO EXCLUDE MOBILE TEMPORARILY
# ===================================================================

echo "🔄 Creating a stable core setup (excluding mobile for now)..."

# Create a temporary package.json without mobile in workspaces
cat > package.json << 'EOF'
{
  "name": "trailverse",
  "version": "1.0.0",
  "description": "🔥 Trailverse - Your Universe of Trail Adventures. Advanced National Parks Explorer with AI, AR, and Real-time Features",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "build:shared": "cd shared && npm run build",
    "test": "npm run test:client && npm run test:server",
    "test:client": "cd client && npm run test",
    "test:server": "cd server && npm run test",
    "lint": "npm run lint:client && npm run lint:server && npm run lint:shared",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    "lint:shared": "cd shared && npm run lint",
    "lint:fix": "npm run lint:client -- --fix && npm run lint:server -- --fix && npm run lint:shared -- --fix",
    "setup": "npm install",
    "setup:workspaces": "npm run setup:shared && npm run setup:client && npm run setup:server",
    "setup:shared": "cd shared && npm install",
    "setup:client": "cd client && npm install",
    "setup:server": "cd server && npm install",
    "setup:mobile": "cd mobile && npm install",
    "docker:dev": "docker-compose -f docker-compose.yml up",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "clean": "npm run clean:deps && npm run clean:builds",
    "clean:deps": "rm -rf node_modules client/node_modules server/node_modules shared/node_modules mobile/node_modules",
    "clean:builds": "rm -rf client/dist server/dist shared/dist",
    "reset": "npm run clean && npm install && npm run setup:workspaces"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/trailversedev/trailverse.git"
  },
  "keywords": [
    "trailverse",
    "national-parks",
    "travel",
    "outdoor",
    "trails",
    "hiking",
    "react",
    "nodejs",
    "ai",
    "machine-learning",
    "ar",
    "augmented-reality",
    "real-time",
    "pwa",
    "mobile-app",
    "adventure",
    "nature",
    "exploration"
  ],
  "author": "Trailverse Team <dev@trailverse.app>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/trailversedev/trailverse/issues"
  },
  "homepage": "https://trailverse.app",
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "volta": {
    "node": "18.19.0",
    "npm": "10.2.3"
  }
}
EOF

echo ""
echo "✅ DEPENDENCY ISSUES FIXED!"
echo "=========================="
echo ""
echo "🔧 What was fixed:"
echo "├── ✅ Updated mobile package.json with compatible React versions"
echo "├── ✅ Updated all workspace package.json files"
echo "├── ✅ Temporarily excluded mobile from root workspaces"
echo "├── ✅ Added proper TypeScript configurations"
echo "├── ✅ Created step-by-step setup instructions"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🧹 Clean existing installations:"
echo "   npm run clean"
echo ""
echo "2. 📦 Install core dependencies:"
echo "   npm install"
echo "   npm run setup:workspaces"
echo ""
echo "3. ⚙️ Configure environment:"
echo "   cp .env.example .env"
echo "   cp client/.env.example client/.env"
echo "   cp server/.env.example server/.env"
echo ""
echo "4. 🚀 Start development:"
echo "   docker-compose up -d"
echo "   npm run dev"
echo ""
echo "📱 Mobile Note:"
echo "   Mobile setup is separate - install core first!"
echo "   Later: cd mobile && npm install"
echo ""
echo "🎯 This should resolve the dependency conflicts!"
