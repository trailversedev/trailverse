// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';

const prisma = new PrismaClient();

// Redis configuration for Docker container
const redis = new Redis({
  host: process.env.REDIS_HOST || 'trailverse-redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'trailverse:',
});

// Environment validation
const validateEnvironment = () => {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN'
  ];

  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (process.env.JWT_SECRET!.length < 32 || process.env.JWT_REFRESH_SECRET!.length < 32) {
    throw new Error('JWT secrets must be at least 32 characters long');
  }
};

// Call validation when module loads
try {
  validateEnvironment();
} catch (error) {
  console.warn('Environment validation warning:', error.message);
}

// Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastAccessedAt: string;
  ipAddress: string;
  userAgent: string;
}

// Audit logging utility
const auditLog = (action: string, req: Request, details?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    action,
    userId: req.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    details
  };

  console.log(`[AUDIT] ${JSON.stringify(logData)}`);
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));

  res.removeHeader('X-Powered-By');
  next();
};

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  const sessionToken = req.csrfToken;

  if (!token || !sessionToken || !compareTokens(token, sessionToken)) {
    auditLog('CSRF_TOKEN_INVALID', req, { providedToken: !!token });
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
    return;
  }

  next();
};

/**
 * Generate CSRF Token
 */
export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Compare tokens in constant time
 */
const compareTokens = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Redis-based Rate Limiting
 */
export const createRateLimit = (options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  const { maxRequests, windowMs, keyGenerator, skipSuccessfulRequests = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : `rate_limit:${req.ip}`;
      const window = Math.floor(Date.now() / windowMs);
      const redisKey = `${key}:${window}`;

      const current = await redis.incr(redisKey);

      if (current === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, maxRequests - current);
      const resetTime = (window + 1) * windowMs;

      req.rateLimitInfo = {
        remaining,
        resetTime
      };

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      if (current > maxRequests) {
        auditLog('RATE_LIMIT_EXCEEDED', req, {
          key,
          current,
          maxRequests
        });

        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        });
        return;
      }

      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            redis.decr(redisKey).catch(console.error);
          }
          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

/**
 * User-specific rate limiting
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return createRateLimit({
    maxRequests,
    windowMs,
    keyGenerator: (req) => req.user ? `user_rate_limit:${req.user.id}` : `ip_rate_limit:${req.ip}`,
    skipSuccessfulRequests: true
  });
};

/**
 * IP-based rate limiting
 */
export const ipRateLimit = (maxRequests: number, windowMs: number) => {
  return createRateLimit({
    maxRequests,
    windowMs,
    keyGenerator: (req) => `ip_rate_limit:${req.ip}`
  });
};

/**
 * Enhanced JWT Authentication Middleware
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const tokenVersionKey = `token_version:${decoded.userId}`;
    const currentTokenVersion = await redis.get(tokenVersionKey);

    if (currentTokenVersion && parseInt(currentTokenVersion) > decoded.tokenVersion) {
      auditLog('TOKEN_REVOKED', req, { userId: decoded.userId });
      res.status(401).json({
        success: false,
        error: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true
      }
    });

    if (!user) {
      auditLog('USER_NOT_FOUND', req, { userId: decoded.userId });
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    if (!user.isActive) {
      auditLog('ACCOUNT_DEACTIVATED', req, { userId: user.id });
      res.status(401).json({
        success: false,
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      auditLog('PASSWORD_CHANGED_TOKEN_INVALID', req, { userId: user.id });
      res.status(401).json({
        success: false,
        error: 'Token invalid due to password change',
        code: 'PASSWORD_CHANGED'
      });
      return;
    }

    req.user = user;
    req.sessionId = decoded.sessionId;

    if (!req.csrfToken) {
      req.csrfToken = generateCSRFToken();
    }

    if (decoded.sessionId) {
      const sessionKey = `session:${decoded.sessionId}`;
      const sessionData = await redis.get(sessionKey);

      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        session.lastAccessedAt = new Date().toISOString();
        await redis.setex(sessionKey, 3600, JSON.stringify(session));
      }
    }

    next();
  } catch (error) {
    auditLog('AUTH_ERROR', req, {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional Authentication Middleware
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    await authenticateToken(req, res, next);
  } catch (error) {
    next();
  }
};

/**
 * Role-based Authorization Middleware
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      auditLog('INSUFFICIENT_PERMISSIONS', req, {
        required: roles,
        current: req.user.role
      });
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Predefined role middlewares
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requireRanger = requireRole(UserRole.RANGER, UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requirePremium = requireRole(UserRole.PREMIUM, UserRole.RANGER, UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Email Verification Middleware
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.isVerified) {
    auditLog('EMAIL_VERIFICATION_REQUIRED', req);
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
    return;
  }

  next();
};

/**
 * Development Authentication Bypass
 */
export const devBypassAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    req.user = {
      id: 'dev-user-id',
      email: 'dev@trailverse.com',
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true
    };
    req.sessionId = 'dev-session-id';
    req.csrfToken = generateCSRFToken();
  }

  next();
};

// Helper Functions

/**
 * Create session in Redis
 */
export const createSession = async (
  userId: string,
  email: string,
  role: UserRole,
  req: Request
): Promise<string> => {
  const sessionId = randomBytes(32).toString('hex');
  const sessionData: SessionData = {
    userId,
    email,
    role,
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    ipAddress: req.ip || '',
    userAgent: req.get('User-Agent') || ''
  };

  const sessionKey = `session:${sessionId}`;
  await redis.setex(sessionKey, 3600, JSON.stringify(sessionData));

  return sessionId;
};

/**
 * Destroy session
 */
export const destroySession = async (sessionId: string): Promise<void> => {
  const sessionKey = `session:${sessionId}`;
  await redis.del(sessionKey);
};

/**
 * Revoke all user tokens
 */
export const revokeUserTokens = async (userId: string): Promise<void> => {
  const tokenVersionKey = `token_version:${userId}`;
  await redis.incr(tokenVersionKey);
};

/**
 * Generate secure access token
 */
export function generateAccessToken(
  user: { id: string; email: string; role: UserRole },
  sessionId: string,
  tokenVersion: number = 1
): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      tokenVersion
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'trailverse',
      audience: 'trailverse-users'
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(
  userId: string,
  sessionId: string,
  tokenVersion: number = 1
): string {
  return jwt.sign(
    {
      userId,
      sessionId,
      tokenVersion
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'trailverse',
      audience: 'trailverse-refresh'
    }
  );
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    issuer: 'trailverse',
    audience: 'trailverse-refresh'
  }) as RefreshTokenPayload;
}

/**
 * Generate API key
 */
export function generateApiKey(): { key: string; hashedKey: string } {
  const key = `tk_${randomBytes(32).toString('hex')}`;
  const hashedKey = createHash('sha256').update(key).digest('hex');
  return { key, hashedKey };
}

// Export default middleware collection
export default {
  authenticateToken,
  optionalAuth,
  securityHeaders,
  csrfProtection,
  userRateLimit,
  ipRateLimit,
  createRateLimit,
  requireRole,
  requireAdmin,
  requireRanger,
  requirePremium,
  requireVerifiedEmail,
  devBypassAuth,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateApiKey,
  createSession,
  destroySession,
  revokeUserTokens,
  generateCSRFToken
};
