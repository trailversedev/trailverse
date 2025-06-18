// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis, RedisKeys, RedisHelpers } from '../config/redis';
import { prisma, CommonQueries } from '../config/database';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError
} from './errorHandler';
import { authService } from '../services/authService';

// Environment validation
const validateEnvironment = () => {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'SESSION_SECRET'
  ];

  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  // Validate secret strength (minimum 32 characters)
  if (process.env.JWT_SECRET!.length < 32 || process.env.JWT_REFRESH_SECRET!.length < 32) {
    throw new Error('JWT secrets must be at least 32 characters long');
  }
};

// Call validation when module loads
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isVerified: boolean;
        isActive: boolean;
      };
      sessionId?: string;
      csrfToken?: string;
      rateLimitInfo?: {
        remaining: number;
        resetTime: number;
      };
    }
  }
}

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

// ===============================
// 🛡️ SECURITY HEADERS MIDDLEWARE
// ===============================

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
};

// ===============================
// 🔐 CSRF PROTECTION
// ===============================

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS
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

export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex');
};

const compareTokens = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// ===============================
// 📊 RATE LIMITING
// ===============================

export const createRateLimit = (options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  const { maxRequests, windowMs, keyGenerator, skipSuccessfulRequests = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : RedisKeys.rateLimit(req.ip || 'unknown');
      const window = Math.floor(Date.now() / windowMs);
      const redisKey = `${key}:${window}`;

      const current = await RedisHelpers.incrWithExpire(redisKey, Math.ceil(windowMs / 1000));

      const remaining = Math.max(0, maxRequests - current);
      const resetTime = (window + 1) * windowMs;

      // Add rate limit info to request
      req.rateLimitInfo = {
        remaining,
        resetTime
      };

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

      if (current > maxRequests) {
        auditLog('RATE_LIMIT_EXCEEDED', req, {
          key,
          current,
          maxRequests
        });

        throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds`);
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow request through if Redis fails
      next();
    }
  };
};

export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return createRateLimit({
    maxRequests,
    windowMs,
    keyGenerator: (req) => req.user ? RedisKeys.rateLimit(`user:${req.user.id}`) : RedisKeys.rateLimit(`ip:${req.ip}`),
    skipSuccessfulRequests: true
  });
};

export const ipRateLimit = (maxRequests: number, windowMs: number) => {
  return createRateLimit({
    maxRequests,
    windowMs,
    keyGenerator: (req) => RedisKeys.rateLimit(`ip:${req.ip}`)
  });
};

// ===============================
// 🔐 JWT AUTHENTICATION
// ===============================

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Check token version in Redis (for token revocation)
    const tokenVersionKey = RedisKeys.tokenVersion(decoded.userId);
    const currentTokenVersion = await redis.get(tokenVersionKey);

    if (currentTokenVersion && parseInt(currentTokenVersion) > decoded.tokenVersion) {
      auditLog('TOKEN_REVOKED', req, { userId: decoded.userId });
      throw new AuthenticationError('Token revoked');
    }

    // Fetch user from database with proper error handling
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
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      auditLog('ACCOUNT_DEACTIVATED', req, { userId: user.id });
      throw new AuthenticationError('Account deactivated');
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      auditLog('PASSWORD_CHANGED_TOKEN_INVALID', req, { userId: user.id });
      throw new AuthenticationError('Token invalid due to password change');
    }

    // Attach user data to request
    req.user = user;
    req.sessionId = decoded.sessionId;

    // Generate CSRF token if not exists
    if (!req.csrfToken) {
      req.csrfToken = generateCSRFToken();
    }

    // Update last activity in session
    if (decoded.sessionId) {
      const sessionKey = RedisKeys.session(decoded.sessionId);
      const sessionData = await RedisHelpers.getJSON<SessionData>(sessionKey);

      if (sessionData) {
        sessionData.lastAccessedAt = new Date().toISOString();
        await RedisHelpers.setJSON(sessionKey, sessionData, 3600); // 1 hour TTL
      }
    }

    next();
  } catch (error) {
    // Let the error handler middleware handle all errors
    next(error);
  }
};

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
    // Continue without authentication if token is invalid
    next();
  }
};

// ===============================
// 🔐 SESSION MANAGEMENT
// ===============================

export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.sessionId) {
      res.status(401).json({
        success: false,
        error: 'Valid session required',
        code: 'SESSION_REQUIRED'
      });
      return;
    }

    const sessionKey = RedisKeys.session(req.sessionId);
    const sessionData = await RedisHelpers.getJSON<SessionData>(sessionKey);

    if (!sessionData) {
      auditLog('SESSION_NOT_FOUND', req);
      res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        code: 'SESSION_INVALID'
      });
      return;
    }

    // Validate session belongs to user
    if (sessionData.userId !== req.user.id) {
      auditLog('SESSION_USER_MISMATCH', req, {
        sessionUserId: sessionData.userId,
        requestUserId: req.user.id
      });
      res.status(401).json({
        success: false,
        error: 'Session user mismatch',
        code: 'SESSION_MISMATCH'
      });
      return;
    }

    // Optional: Validate IP address consistency
    if (process.env.STRICT_SESSION_IP === 'true' && sessionData.ipAddress !== req.ip) {
      auditLog('SESSION_IP_MISMATCH', req, {
        sessionIp: sessionData.ipAddress,
        requestIp: req.ip
      });
      res.status(401).json({
        success: false,
        error: 'Session IP mismatch',
        code: 'SESSION_IP_MISMATCH'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Session validation failed',
      code: 'SESSION_ERROR'
    });
  }
};

// ===============================
// 🛡️ AUTHORIZATION
// ===============================

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      auditLog('INSUFFICIENT_PERMISSIONS', req, {
        required: roles,
        current: req.user.role
      });
      throw new AuthorizationError(`Insufficient permissions. Required: ${roles.join(', ')}`);
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requireRanger = requireRole(UserRole.RANGER, UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requirePremium = requireRole(UserRole.PREMIUM, UserRole.RANGER, UserRole.ADMIN, UserRole.SUPER_ADMIN);

export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!req.user.isVerified) {
    auditLog('EMAIL_VERIFICATION_REQUIRED', req);
    throw new AuthorizationError('Email verification required');
  }

  next();
};

export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Allow admins to access any resource
      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role)) {
        next();
        return;
      }

      const isOwner = await checkResourceOwnership(userId, resourceId, req.route?.path || req.path);

      if (!isOwner) {
        auditLog('ACCESS_DENIED_NOT_OWNER', req, {
          resourceId,
          resourceType: req.route?.path || req.path
        });
        res.status(403).json({
          success: false,
          error: 'Access denied - not resource owner',
          code: 'NOT_OWNER'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership validation failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

// ===============================
// 🔑 API KEY AUTHENTICATION
// ===============================

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'API_KEY_MISSING'
      });
      return;
    }

    // Hash the provided API key
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');

    // Check if API key exists and is active (when ApiKey model is available)
    // TODO: Implement when Prisma schema includes ApiKey model
    // const apiKeyRecord = await prisma.apiKey.findUnique({
    //   where: { hashedKey },
    //   include: { user: true }
    // });

    // Temporary validation for development
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    if (!validApiKeys.includes(apiKey)) {
      auditLog('API_KEY_INVALID', req, { hashedKey: hashedKey.substring(0, 8) + '...' });
      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'API key authentication failed',
      code: 'API_AUTH_ERROR'
    });
  }
};

// ===============================
// 🛠️ DEVELOPMENT UTILITIES
// ===============================

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

// ===============================
// 🛠️ HELPER FUNCTIONS
// ===============================

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

  const sessionKey = RedisKeys.session(sessionId);
  await RedisHelpers.setJSON(sessionKey, sessionData, 3600); // 1 hour TTL

  return sessionId;
};

export const destroySession = async (sessionId: string): Promise<void> => {
  const sessionKey = RedisKeys.session(sessionId);
  await redis.del(sessionKey);
};

export const revokeUserTokens = async (userId: string): Promise<void> => {
  const tokenVersionKey = RedisKeys.tokenVersion(userId);
  await redis.incr(tokenVersionKey);
};

async function checkResourceOwnership(
  userId: string,
  resourceId: string,
  routePath: string
): Promise<boolean> {
  try {
    if (routePath.includes('/trips')) {
      // TODO: Implement when Trip model is available
      // const trip = await prisma.trip.findFirst({
      //   where: { id: resourceId, userId },
      //   select: { id: true }
      // });
      // return !!trip;
      return true; // Temporary for development
    }

    if (routePath.includes('/reviews')) {
      const review = await prisma.review.findFirst({
        where: { id: resourceId, userId },
        select: { id: true }
      });
      return !!review;
    }

    if (routePath.includes('/favorites')) {
      // TODO: Implement when Favorite model is available
      // const favorite = await prisma.favorite.findFirst({
      //   where: { id: resourceId, userId },
      //   select: { id: true }
      // });
      // return !!favorite;
      return true; // Temporary for development
    }

    if (routePath.includes('/profiles') || routePath.includes('/users')) {
      return resourceId === userId;
    }

    return false;
  } catch (error) {
    console.error('Resource ownership check error:', error);
    return false;
  }
}

// ===============================
// 🔐 TOKEN GENERATION
// ===============================

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

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    issuer: 'trailverse',
    audience: 'trailverse-refresh'
  }) as RefreshTokenPayload;
}

export function generateApiKey(): { key: string; hashedKey: string } {
  const key = `tk_${randomBytes(32).toString('hex')}`;
  const hashedKey = createHash('sha256').update(key).digest('hex');
  return { key, hashedKey };
}

// ===============================
// 📊 AUDIT LOGGING
// ===============================

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

  // In production, send to external logging service
  // await logService.send(logData);
};

// ===============================
// 📤 EXPORTS
// ===============================

export default {
  // Core authentication
  authenticateToken,
  optionalAuth,
  validateSession,

  // Security
  securityHeaders,
  csrfProtection,

  // Rate limiting
  userRateLimit,
  ipRateLimit,
  createRateLimit,

  // Authorization
  requireRole,
  requireAdmin,
  requireRanger,
  requirePremium,
  requireVerifiedEmail,
  requireOwnership,

  // Alternative auth methods
  authenticateApiKey,
  devBypassAuth,

  // Token management
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateApiKey,

  // Session management
  createSession,
  destroySession,
  revokeUserTokens,

  // Utilities
  generateCSRFToken
};
