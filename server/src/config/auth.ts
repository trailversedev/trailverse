// ===================================================================
// server/src/config/auth.ts - Authentication Configuration
// ===================================================================

export const AUTH_CONFIG = {
  // JWT Configuration
  jwt: {
    algorithm: 'HS256' as const,
    issuer: 'trailverse',
    audience: {
      access: 'trailverse-users',
      refresh: 'trailverse-refresh'
    },
    expiresIn: {
      access: process.env.JWT_EXPIRES_IN || '15m',
      refresh: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
  },

  // Session Configuration
  session: {
    ttl: 3600, // 1 hour in seconds
    cleanupInterval: 300, // 5 minutes
    maxConcurrentSessions: 5
  },

  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limiting
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },

    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // Stricter for auth endpoints
    },

    // User-specific actions
    user: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000
    },

    // API key rate limiting
    apiKey: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5000
    }
  },

  // Security Configuration
  security: {
    // Minimum password requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },

    // Account lockout
    lockout: {
      maxAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      resetAfter: 24 * 60 * 60 * 1000 // 24 hours
    },

    // CSRF Protection
    csrf: {
      tokenLength: 32,
      headerName: 'x-csrf-token'
    }
  },

  // API Key Configuration
  apiKey: {
    defaultRateLimit: 1000,
    keyLength: 32,
    prefix: 'tk_'
  }
} as const;
