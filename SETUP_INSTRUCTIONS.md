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
