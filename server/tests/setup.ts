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
