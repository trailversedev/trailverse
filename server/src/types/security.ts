// ===================================================================
// server/src/middleware/security.ts - Additional Security Middleware
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { redis, RedisKeys } from '../config/redis';
import { AUTH_CONFIG } from '../config/auth';

/**
 * Account Lockout Protection
 * Prevents brute force attacks by locking accounts after failed attempts
 */
export const accountLockoutProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // This middleware should be applied to login routes
  const identifier = req.body.email || req.ip;

  if (!identifier) {
    next();
    return;
  }

  const lockoutKey = RedisKeys.accountLockout(identifier);

  redis.get(lockoutKey).then(lockoutData => {
    if (lockoutData) {
      const lockout = JSON.parse(lockoutData);

      if (lockout.isLocked && new Date(lockout.lockoutExpires) > new Date()) {
        res.status(423).json({
          success: false,
          error: 'Account temporarily locked due to multiple failed attempts',
          code: 'ACCOUNT_LOCKED',
          lockoutExpires: lockout.lockoutExpires
        });
        return;
      }
    }

    next();
  }).catch(error => {
    console.error('Account lockout check error:', error);
    next();
  });
};

/**
 * Track Login Attempts
 * Records failed login attempts and implements lockout logic
 */
export const trackLoginAttempt = (success: boolean) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.body.email || req.ip;

    if (!identifier) {
      next();
      return;
    }

    const lockoutKey = RedisKeys.accountLockout(identifier);

    try {
      if (success) {
        // Clear lockout on successful login
        await redis.del(lockoutKey);
      } else {
        // Increment failed attempts
        const lockoutData = await redis.get(lockoutKey);
        let attempts = 1;

        if (lockoutData) {
          const existing = JSON.parse(lockoutData);
          attempts = existing.attempts + 1;
        }

        const lockout = {
          identifier,
          attempts,
          lastAttempt: new Date().toISOString(),
          isLocked: attempts >= AUTH_CONFIG.security.lockout.maxAttempts,
          lockoutExpires: attempts >= AUTH_CONFIG.security.lockout.maxAttempts
            ? new Date(Date.now() + AUTH_CONFIG.security.lockout.lockoutDuration).toISOString()
            : undefined
        };

        await redis.setex(
          lockoutKey,
          AUTH_CONFIG.security.lockout.resetAfter / 1000,
          JSON.stringify(lockout)
        );
      }
    } catch (error) {
      console.error('Login attempt tracking error:', error);
    }

    next();
  };
};

/**
 * Device Fingerprinting
 * Creates a fingerprint based on request headers for additional security
 */
export const deviceFingerprint = (req: Request): string => {
  const components = [
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
    req.ip || ''
  ];

  return require('crypto')
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

/**
 * Suspicious Activity Detection
 * Monitors for suspicious patterns in authentication
 */
export const suspiciousActivityDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for suspicious patterns
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || '';

  // Flag suspicious user agents
  const suspiciousUA = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python'
  ].some(pattern => userAgent.toLowerCase().includes(pattern));

  // Flag rapid requests from same IP (basic check)
  if (suspiciousUA) {
    console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${ip}`);
    // Could implement additional logging or blocking here
  }

  next();
};
