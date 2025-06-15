#!/bin/bash

echo "🔍 Verifying Trailverse configuration setup..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅ $1${NC}"
    return 0
  else
    echo -e "${RED}❌ $1 (missing)${NC}"
    return 1
  fi
}

# Function to check TypeScript compilation
check_typescript() {
  echo ""
  echo "🔍 Checking TypeScript configurations..."

  cd shared && npm run build > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Shared TypeScript compilation${NC}"
  else
    echo -e "${RED}❌ Shared TypeScript compilation failed${NC}"
  fi
  cd ..

  cd client && npm run type-check > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client TypeScript type checking${NC}"
  else
    echo -e "${RED}❌ Client TypeScript type checking failed${NC}"
  fi
  cd ..

  cd server && npm run type-check > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server TypeScript type checking${NC}"
  else
    echo -e "${RED}❌ Server TypeScript type checking failed${NC}"
  fi
  cd ..
}

# Function to check linting
check_linting() {
  echo ""
  echo "🧹 Checking ESLint configurations..."

  cd shared && npm run lint > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Shared ESLint${NC}"
  else
    echo -e "${YELLOW}⚠️  Shared ESLint (may have warnings)${NC}"
  fi
  cd ..

  cd client && npm run lint > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client ESLint${NC}"
  else
    echo -e "${YELLOW}⚠️  Client ESLint (may have warnings)${NC}"
  fi
  cd ..

  cd server && npm run lint > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server ESLint${NC}"
  else
    echo -e "${YELLOW}⚠️  Server ESLint (may have warnings)${NC}"
  fi
  cd ..
}

# Function to check Prettier
check_prettier() {
  echo ""
  echo "💅 Checking Prettier formatting..."

  npx prettier --check . > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prettier formatting${NC}"
  else
    echo -e "${YELLOW}⚠️  Some files need Prettier formatting${NC}"
    echo -e "${YELLOW}    Run: npm run format to fix${NC}"
  fi
}

echo ""
echo "📋 Configuration Files:"
echo "======================="

# Check root configuration files
check_file "tsconfig.json"
check_file ".eslintrc.js"
check_file ".prettierrc"
check_file ".prettierignore"

echo ""
echo "📋 Client Configuration:"
echo "======================="
check_file "client/tsconfig.json"
check_file "client/tsconfig.node.json"
check_file "client/.eslintrc.js"
check_file "client/vitest.config.ts"
check_file "client/src/test/setup.ts"

echo ""
echo "📋 Server Configuration:"
echo "======================="
check_file "server/tsconfig.json"
check_file "server/.eslintrc.js"
check_file "server/jest.config.js"
check_file "server/nodemon.json"
check_file "server/tests/setup.ts"

echo ""
echo "📋 Shared Configuration:"
echo "======================="
check_file "shared/tsconfig.json"
check_file "shared/.eslintrc.js"

echo ""
echo "📋 VS Code Configuration:"
echo "========================"
check_file ".vscode/settings.json"
check_file ".vscode/extensions.json"

# Run checks if dependencies are installed
if [ -d "node_modules" ]; then
  check_typescript
  check_linting
  check_prettier
else
  echo ""
  echo -e "${YELLOW}⚠️  Dependencies not installed yet. Run 'npm run setup:workspaces' first.${NC}"
fi

echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. Install dependencies: npm run setup:workspaces"
echo "2. Run type checking: npm run type-check (in each workspace)"
echo "3. Run linting: npm run lint (in each workspace)"
echo "4. Format code: npm run format (in each workspace)"
echo "5. Run tests: npm run test (in each workspace)"
echo ""
echo "🚀 Happy coding!"
