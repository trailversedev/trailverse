#!/bin/bash

echo "🚀 Trailverse Quick Start"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm run setup:workspaces

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Setup environment files
echo ""
echo "⚙️ Step 2: Setting up environment files..."
./setup-env.sh

# Step 3: Type checking
echo ""
echo "🔍 Step 3: Running type checks..."
npm run type-check

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All TypeScript checks passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some TypeScript issues found, but continuing...${NC}"
fi

# Step 4: Linting
echo ""
echo "🧹 Step 4: Running linting..."
npm run lint

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All linting checks passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some linting issues found. Run 'npm run lint:fix' to fix automatically.${NC}"
fi

# Step 5: Format code
echo ""
echo "💅 Step 5: Formatting code..."
npm run format

echo -e "${GREEN}✅ Code formatted successfully${NC}"

# Step 6: Run tests
echo ""
echo "🧪 Step 6: Running tests..."
npm run test

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed or need to be written${NC}"
fi

echo ""
echo "🎉 TRAILVERSE SETUP COMPLETE!"
echo "=============================="
echo ""
echo -e "${GREEN}🚀 Ready to start development:${NC}"
echo ""
echo "1. Start databases:"
echo "   docker-compose up -d"
echo ""
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo ""
echo -e "${GREEN}Happy coding! 🏔️${NC}"
