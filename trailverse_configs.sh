# 🔧 Trailverse - TypeScript, ESLint & Prettier Configurations

echo "⚙️ Creating comprehensive TypeScript, ESLint & Prettier configurations..."

# ===================================================================
# ROOT CONFIGURATIONS
# ===================================================================

# Root TypeScript configuration (base config)
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@trailverse/shared": ["./shared"],
      "@trailverse/shared/*": ["./shared/*"]
    }
  },
  "include": [],
  "exclude": ["node_modules", "dist", "build"],
  "references": [
    { "path": "./client" },
    { "path": "./server" },
    { "path": "./shared" }
  ]
}
EOF

# Root ESLint configuration
cat > .eslintrc.js << 'EOF'
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
  },
  overrides: [
    // Client-specific rules
    {
      files: ['client/**/*'],
      env: {
        browser: true,
        es2022: true,
      },
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/anchor-is-valid': 'warn',
      },
    },
    // Server-specific rules
    {
      files: ['server/**/*'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off', // Allow console in server
      },
    },
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.min.js',
    'coverage/',
    '.next/',
    'out/',
    'public/',
    '*.d.ts',
  ],
}
EOF

# Root Prettier configuration
cat > .prettierrc << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSameLine": false,
  "embeddedLanguageFormatting": "auto",
  "htmlWhitespaceSensitivity": "css",
  "insertPragma": false,
  "jsxSingleQuote": true,
  "proseWrap": "preserve",
  "quoteProps": "as-needed",
  "requirePragma": false,
  "useTabs": false,
  "vueIndentScriptAndStyle": false
}
EOF

# Prettier ignore file
cat > .prettierignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/build
/dist
/.next/
/out/

# Generated files
*.min.js
*.min.css
*.bundle.js

# Package managers
package-lock.json
yarn.lock
pnpm-lock.yaml

# Environment files
.env*

# Coverage
coverage/
*.lcov

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Docker
Dockerfile
docker-compose*.yml

# Prisma
prisma/migrations/

# Documentation (except README)
CHANGELOG.md

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# ML/AI files
*.pkl
*.model
*.weights
*.h5
*.pb

# Terraform
*.tfstate
*.tfstate.*
.terraform/
EOF

# ===================================================================
# CLIENT CONFIGURATIONS
# ===================================================================

echo "⚛️ Creating client configurations..."

# Client TypeScript configuration
cat > client/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/pages/*": ["src/pages/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/store/*": ["src/store/*"],
      "@/styles/*": ["src/styles/*"],
      "@/assets/*": ["src/assets/*"],
      "@/config/*": ["src/config/*"],
      "@/ai/*": ["src/ai/*"],
      "@trailverse/shared": ["../shared"],
      "@trailverse/shared/*": ["../shared/*"]
    },
    "types": ["vite/client", "node", "@testing-library/jest-dom"]
  },
  "include": [
    "src/**/*",
    "src/**/*.tsx",
    "src/**/*.ts",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "../shared" }
  ]
}
EOF

# Client node TypeScript configuration
cat > client/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"]
  },
  "include": [
    "vite.config.ts",
    "vitest.config.ts",
    "tailwind.config.js",
    "postcss.config.js"
  ]
}
EOF

# Client ESLint configuration
cat > client/.eslintrc.js << 'EOF'
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'react-refresh',
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/display-name': 'warn',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Refresh
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // Accessibility rules
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
        'vitest-globals/env': true,
      },
      extends: ['plugin:testing-library/react'],
      plugins: ['testing-library'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Vite config
    {
      files: ['vite.config.ts', 'vitest.config.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.min.js',
    'coverage/',
    'public/',
    'vite.config.ts.timestamp-*',
  ],
}
EOF

# ===================================================================
# SERVER CONFIGURATIONS
# ===================================================================

echo "🚀 Creating server configurations..."

# Server TypeScript configuration
cat > server/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
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
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/models/*": ["src/models/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/config/*": ["src/config/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/routes/*": ["src/routes/*"],
      "@/ai/*": ["src/ai/*"],
      "@/realtime/*": ["src/realtime/*"],
      "@trailverse/shared": ["../shared"],
      "@trailverse/shared/*": ["../shared/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "jest"]
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "references": [
    { "path": "../shared" }
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
EOF

# Server ESLint configuration
cat > server/.eslintrc.js << 'EOF'
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'security', 'node'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
    'plugin:node/recommended',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/return-await': 'error',

    // Node.js rules
    'node/no-missing-import': 'off', // TypeScript handles this
    'node/no-unsupported-features/es-syntax': 'off', // We use TypeScript
    'node/no-unpublished-import': 'off',
    'node/prefer-global/process': 'error',
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',

    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',

    // General rules
    'no-console': 'off', // Allow console in server
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Error handling
    'handle-callback-err': 'error',
    'no-process-exit': 'error',
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off',
        'security/detect-non-literal-fs-filename': 'off',
      },
    },
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', 'nodemon.json'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
        'node/no-unpublished-require': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.d.ts',
    'prisma/migrations/',
  ],
}
EOF

# ===================================================================
# SHARED CONFIGURATIONS
# ===================================================================

echo "🔗 Creating shared configurations..."

# Shared TypeScript configuration (update existing)
cat > shared/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
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
    "removeComments": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/types/*": ["./types/*"],
      "@/constants/*": ["./constants/*"],
      "@/utils/*": ["./utils/*"],
      "@/schemas/*": ["./schemas/*"]
    },
    "types": ["node"]
  },
  "include": [
    "types/**/*",
    "constants/**/*",
    "utils/**/*",
    "schemas/**/*",
    "index.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF

# Shared ESLint configuration
cat > shared/.eslintrc.js << 'EOF'
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-explicit-any': 'error', // Stricter in shared
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.d.ts',
  ],
}
EOF

# ===================================================================
# ADDITIONAL CONFIGURATION FILES
# ===================================================================

echo "📋 Creating additional configuration files..."

# Jest configuration for server
cat > server/jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/**/*.config.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@trailverse/shared/(.*)$': '<rootDir>/../shared/$1',
    '^@trailverse/shared$': '<rootDir>/../shared',
  },
  testTimeout: 10000,
}
EOF

# Vitest configuration for client
cat > client/vitest.config.ts << 'EOF'
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/store': resolve(__dirname, './src/store'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@/config': resolve(__dirname, './src/config'),
      '@/ai': resolve(__dirname, './src/ai'),
      '@trailverse/shared': resolve(__dirname, '../shared'),
    },
  },
})
EOF

# Create test setup files
mkdir -p client/src/test
cat > client/src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
})

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}
EOF

mkdir -p server/tests
cat > server/tests/setup.ts << 'EOF'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'

// Mock console methods in tests if needed
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}

// Global test setup
beforeAll(async () => {
  // Database setup, Redis connection, etc.
  console.log('🧪 Setting up test environment...')
})

afterAll(async () => {
  // Cleanup
  console.log('🧹 Cleaning up test environment...')
})
EOF

# ===================================================================
# VSCODE WORKSPACE CONFIGURATION
# ===================================================================

echo "📝 Creating VS Code workspace configuration..."

# Update VS Code settings for better TypeScript support
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.inlayHints.parameterNames.enabled": "literals",
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,

  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true,
    "source.addMissingImports": true
  },
  "editor.rulers": [100],
  "editor.wordWrap": "wordWrapColumn",
  "editor.wordWrapColumn": 100,

  "files.associations": {
    "*.env*": "dotenv",
    "*.css": "tailwindcss"
  },

  "eslint.workingDirectories": [
    "client",
    "server",
    "shared"
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },

  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/coverage": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true,
    "**/*.log": true
  },

  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],

  "jest.jestCommandLine": "npm test",
  "vitest.enable": true,

  "git.ignoreLimitWarning": true,
  "git.autofetch": true,

  "workbench.editor.labelFormat": "medium",
  "breadcrumbs.enabled": true,

  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.windows": "PowerShell",

  "npm.enableScriptExplorer": true,
  "npm.scriptExplorerAction": "run"
}
EOF

# Update VS Code extensions
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    // Essential TypeScript & JavaScript
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",

    // React & Frontend
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "zignd.html-css-class-completion",

    // Testing
    "orta.vscode-jest",
    "vitest.explorer",

    // Git & Version Control
    "eamodio.gitlens",
    "github.vscode-pull-request-github",
    "github.copilot",
    "github.copilot-chat",

    // Database & API
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-vscode-remote.remote-containers",

    // Infrastructure
    "hashicorp.terraform",
    "ms-kubernetes-tools.vscode-kubernetes-tools",

    // Productivity
    "streetsidesoftware.code-spell-checker",
    "ms-vscode.hexeditor",
    "gruntfuggly.todo-tree",
    "alefragnani.bookmarks",
    "ms-vscode.live-server",

    // Theme & UI
    "pkief.material-icon-theme",
    "github.github-vscode-theme",

    // Documentation
    "yzhang.markdown-all-in-one",
    "davidanson.vscode-markdownlint",

    // AI/ML (Optional)
    "ms-python.python",
    "ms-toolsai.jupyter"
  ],
  "unwantedRecommendations": [
    "ms-vscode.vscode-typescript",
    "hookyqr.beautify"
  ]
}
EOF

# ===================================================================
# GITHUB WORKFLOWS UPDATE
# ===================================================================

echo "🔄 Updating GitHub workflows for linting and type checking..."

# Update the CI workflow to include proper linting and type checking
cat > .github/workflows/ci.yml << 'EOF'
name: 🚀 Trailverse CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18.19.0'

jobs:
  # Type Checking
  type-check:
    runs-on: ubuntu-latest
    name: 🔍 Type Check
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: |
          npm ci
          npm run setup:workspaces

      - name: 🔍 Type check shared
        run: cd shared && npm run build

      - name: 🔍 Type check client
        run: cd client && npm run type-check

      - name: 🔍 Type check server
        run: cd server && npm run type-check

  # Linting
  lint:
    runs-on: ubuntu-latest
    name: 🧹 Lint & Format
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: |
          npm ci
          npm run setup:workspaces

      - name: 🧹 Lint shared
        run: cd shared && npm run lint

      - name: 🧹 Lint client
        run: cd client && npm run lint

      - name: 🧹 Lint server
        run: cd server && npm run lint

      - name: 💅 Check Prettier formatting
        run: npx prettier --check .

  # Client Tests
  client-tests:
    runs-on: ubuntu-latest
    name: ⚛️ Client Tests
    needs: [type-check, lint]
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: |
          npm ci
          npm run setup:workspaces

      - name: 🧪 Run client tests
        run: cd client && npm run test:coverage

      - name: 📊 Upload client coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./client/coverage
          flags: client

  # Server Tests
  server-tests:
    runs-on: ubuntu-latest
    name: 🚀 Server Tests
    needs: [type-check, lint]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: trailverse_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: |
          npm ci
          npm run setup:workspaces

      - name: 🧪 Run server tests
        run: cd server && npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/trailverse_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

      - name: 📊 Upload server coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./server/coverage
          flags: server

  # Security Audit
  security:
    runs-on: ubuntu-latest
    name: 🔒 Security Audit
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 🔍 Security audit
        run: |
          npm audit --audit-level high
          cd client && npm audit --audit-level high
          cd ../server && npm audit --audit-level high
          cd ../shared && npm audit --audit-level high

  # Build
  build:
    runs-on: ubuntu-latest
    name: 🏗️ Build
    needs: [client-tests, server-tests, security]
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: |
          npm ci
          npm run setup:workspaces

      - name: 🏗️ Build all packages
        run: npm run build

      - name: 📤 Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            client/dist/
            server/dist/
            shared/dist/

  # Deploy (only on main branch)
  deploy:
    runs-on: ubuntu-latest
    name: 🚀 Deploy
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 📥 Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      - name: 🚀 Deploy to staging
        run: |
          echo "🚀 Deploying to staging environment..."
          # Add your deployment commands here
EOF

# ===================================================================
# PACKAGE.JSON SCRIPTS UPDATE
# ===================================================================

echo "📦 Adding helpful npm scripts..."

# Update client package.json with additional scripts
cat >> client/package.json.tmp << 'EOF'
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
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,css,md,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,css,md,json}\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "clean": "rm -rf dist node_modules/.vite",
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  },
EOF

# Copy the rest of client package.json (dependencies, etc.)
tail -n +10 client/package.json >> client/package.json.tmp
mv client/package.json.tmp client/package.json

# Update server package.json with additional scripts
cat >> server/package.json.tmp << 'EOF'
{
  "name": "trailverse-server",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "nodemon",
    "dev:debug": "nodemon --inspect",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "start": "node dist/app.js",
    "start:prod": "NODE_ENV=production node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "lint": "eslint src --ext .ts --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:reset": "prisma migrate reset",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seeds/index.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset && npm run db:seed",
    "clean": "rm -rf dist"
  },
EOF

# Copy the rest of server package.json
tail -n +20 server/package.json >> server/package.json.tmp
mv server/package.json.tmp server/package.json

# ===================================================================
# CREATE SETUP VERIFICATION SCRIPT
# ===================================================================

echo "✅ Creating setup verification script..."

cat > verify-setup.sh << 'EOF'
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
EOF

chmod +x verify-setup.sh

echo ""
echo "✅ TRAILVERSE CONFIGURATIONS CREATED!"
echo "====================================="
echo ""
echo "📊 Configuration Summary:"
echo "├── 📄 Root configs: tsconfig.json, .eslintrc.js, .prettierrc"
echo "├── ⚛️  Client configs: TypeScript, ESLint, Vitest, VS Code"
echo "├── 🚀 Server configs: TypeScript, ESLint, Jest, Nodemon"
echo "├── 🔗 Shared configs: TypeScript, ESLint (stricter rules)"
echo "├── 🧪 Test configurations: Jest (server), Vitest (client)"
echo "├── 📝 VS Code workspace with extensions and settings"
echo "├── 🔄 Updated GitHub Actions with proper CI/CD"
echo "└── ✅ Verification script to check everything works"
echo ""
echo "🔧 Enhanced Features:"
echo "├── 🎯 Path mapping (@/ aliases) for clean imports"
echo "├── 🔒 Security ESLint rules for server"
echo "├── ♿ Accessibility rules for client (jsx-a11y)"
echo "├── 🧹 Comprehensive Prettier configuration"
echo "├── 📊 Code coverage setup for both client and server"
echo "├── 🔍 Type checking workflows and scripts"
echo "└── 📱 Responsive VS Code setup with Tailwind support"
echo ""
echo "🚀 Next Steps:"
echo "1. Run: ./verify-setup.sh (check if everything works)"
echo "2. Install dependencies: npm run setup:workspaces"
echo "3. Test type checking: npm run type-check (in each workspace)"
echo "4. Test linting: npm run lint (in each workspace)"
echo "5. Format code: npm run format (in each workspace)"
echo ""
echo "🎯 Ready for Phase 1 development!"
