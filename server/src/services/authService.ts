import { PrismaClient, UserRole, EventType } from ‘@prisma/client’;
import Redis from ‘ioredis’;
import crypto from ‘crypto’;
import bcrypt from ‘bcryptjs’;
import { verifyRefreshToken } from ‘../middleware/auth’;

const prisma = new PrismaClient();

// Redis client for session management
const redis = new Redis(process.env.REDIS_URL || ‘redis://localhost:6379’, {
  retryDelayOnFailover: 100,
    enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Session storage keys
const REFRESH_TOKEN_PREFIX = ‘refresh_token:’;
const USER_SESSIONS_PREFIX = ‘user_sessions:’;
const BLACKLISTED_TOKEN_PREFIX = ‘blacklisted_token:’;
const LOGIN_ATTEMPTS_PREFIX = ‘login_attempts:’;
const PASSWORD_RESET_PREFIX = ‘password_reset:’;

interface AnalyticsEventData {
  userId: string;
  eventName: string;
  eventType: EventType;
  category?: string;
  properties?: Record<string, any>;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  city?: string;
}

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: number;
  lastUsed: number;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceType: string;
    browser: string;
  };
}

class AuthService {
  /**

   - Store refresh token with session data
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    sessionId: string,
    deviceInfo?: SessionData[‘deviceInfo’]
): Promise<void> {
  try {
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

    const sessionData: SessionData = {
      userId,
      sessionId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      deviceInfo
    };

    // Store refresh token with 7 days expiry
    await redis.setex(tokenKey, 7 * 24 * 60 * 60, JSON.stringify(sessionData));

    // Add session to user’s session list
    await redis.hset(userSessionsKey, sessionId, JSON.stringify(sessionData));
    await redis.expire(userSessionsKey, 30 * 24 * 60 * 60); // 30 days

    ```
} catch (error) {
  console.error('Error storing refresh token:', error);
  throw new Error('Failed to store session data');
}
```

  }

  /**

   - Validate refresh token and return session data
   */
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const tokenKey = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
      const sessionDataStr = await redis.get(tokenKey);

      if (!sessionDataStr) {
    return false;
  }

  const sessionData: SessionData = JSON.parse(sessionDataStr);

  // Verify the token belongs to the user
  if (sessionData.userId !== userId) {
    return false;
  }

  // Update last used timestamp
  sessionData.lastUsed = Date.now();
  await redis.setex(tokenKey, 7 * 24 * 60 * 60, JSON.stringify(sessionData));

  return true;
} catch (error) {
    console.error(‘Error validating refresh token:’, error);
    return false;
  }
}

  /**

   - Replace old refresh token with new one
   */
  async replaceRefreshToken(
    userId: string,
    oldRefreshToken: string,
    newRefreshToken: string,
    newSessionId: string
): Promise<void> {
    try {
      // Get old session data
      const oldTokenKey = `${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`;
      const oldSessionDataStr = await redis.get(oldTokenKey);

      let deviceInfo: SessionData[‘deviceInfo’] | undefined;
  if (oldSessionDataStr) {
    const oldSessionData: SessionData = JSON.parse(oldSessionDataStr);
    deviceInfo = oldSessionData.deviceInfo;
  }

  // Remove old token
  await this.removeRefreshToken(oldRefreshToken);

  // Store new token
  await this.storeRefreshToken(userId, newRefreshToken, newSessionId, deviceInfo);

  ```
} catch (error) {
  console.error('Error replacing refresh token:', error);
  throw new Error('Failed to replace refresh token');
}
```

}

  /**

   - Remove refresh token and session data
   */
  async removeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenKey = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
      const sessionDataStr = await redis.get(tokenKey);

      if (sessionDataStr) {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        const userSessionsKey = `${USER_SESSIONS_PREFIX}${sessionData.userId}`;

        // Remove from user sessions
        await redis.hdel(userSessionsKey, sessionData.sessionId);
      }

      // Remove refresh token
      await redis.del(tokenKey);

      ```
} catch (error) {
  console.error('Error removing refresh token:', error);
  throw new Error('Failed to remove refresh token');
}
```

  }

  /**

   - Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const sessions = await redis.hgetall(userSessionsKey);

      // Remove all refresh tokens for this user
      const pipeline = redis.pipeline();

      for (const [sessionId, sessionDataStr] of Object.entries(sessions)) {
    try {
      const sessionData: SessionData = JSON.parse(sessionDataStr);
      // Find and remove corresponding refresh tokens
      const pattern = `${REFRESH_TOKEN_PREFIX}*`;
      const keys = await redis.keys(pattern);

      ```
   for (const key of keys) {
     const tokenDataStr = await redis.get(key);
     if (tokenDataStr) {
       const tokenData: SessionData = JSON.parse(tokenDataStr);
       if (tokenData.userId === userId && tokenData.sessionId === sessionId) {
         pipeline.del(key);
         break;
       }
     }
   }
  ```

    } catch (parseError) {
      console.error(‘Error parsing session data:’, parseError);
    }
  }

  // Remove user sessions hash
  pipeline.del(userSessionsKey);
  await pipeline.exec();

  ```
} catch (error) {
  console.error('Error invalidating user sessions:', error);
  throw new Error('Failed to invalidate user sessions');
}
```

}

  /**

   - Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const sessions = await redis.hgetall(userSessionsKey);

      return Object.values(sessions).map(sessionStr => {
        try {
          return JSON.parse(sessionStr) as SessionData;
        } catch {
          return null;
        }
      }).filter(Boolean) as SessionData[];

      ```
} catch (error) {
  console.error('Error getting user sessions:', error);
  return [];
}
```

  }

  /**

   - Blacklist access token
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    try {
      const tokenKey = `${BLACKLISTED_TOKEN_PREFIX}${token}`;
      await redis.setex(tokenKey, expiresIn, ‘blacklisted’);
} catch (error) {
    console.error(‘Error blacklisting token:’, error);
    throw new Error(‘Failed to blacklist token’);
  }
}

  /**

   - Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenKey = `${BLACKLISTED_TOKEN_PREFIX}${token}`;
      const result = await redis.get(tokenKey);
      return result === ‘blacklisted’;
} catch (error) {
    console.error(‘Error checking blacklisted token:’, error);
    return false;
  }
}

  /**

   - Rate limiting for login attempts
   */
  async checkLoginAttempts(identifier: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  }> {
    try {
      const key = `${LOGIN_ATTEMPTS_PREFIX}${identifier}`;
      const attemptDataStr = await redis.get(key);

      const maxAttempts = 5;
      const lockoutDuration = 15 * 60; // 15 minutes
      const windowDuration = 60 * 60; // 1 hour

      if (!attemptDataStr) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1
    };
  }

  const attemptData: LoginAttempt = JSON.parse(attemptDataStr);
  const now = Date.now();

  // Check if still blocked
  if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attemptData.blockedUntil
    };
  }

  // Reset if window expired
  if (now - attemptData.lastAttempt > windowDuration * 1000) {
    await redis.del(key);
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1
    };
  }

  // Check if max attempts reached
  if (attemptData.count >= maxAttempts) {
    const blockedUntil = now + (lockoutDuration * 1000);
    attemptData.blockedUntil = blockedUntil;
    await redis.setex(key, lockoutDuration, JSON.stringify(attemptData));

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: blockedUntil
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attemptData.count - 1
  };

  ```
} catch (error) {
  console.error('Error checking login attempts:', error);
  // Allow login on error to prevent lockout due to system issues
  return {
    allowed: true,
    remainingAttempts: 0
  };
}
```

}

  /**

   - Record failed login attempt
   */
  async recordFailedLogin(identifier: string): Promise<void> {
    try {
      const key = `${LOGIN_ATTEMPTS_PREFIX}${identifier}`;
      const attemptDataStr = await redis.get(key);
      const now = Date.now();

      let attemptData: LoginAttempt;
  if (attemptDataStr) {
    attemptData = JSON.parse(attemptDataStr);
    attemptData.count++;
    attemptData.lastAttempt = now;
  } else {
    attemptData = {
      count: 1,
      lastAttempt: now
    };
  }

  await redis.setex(key, 60 * 60, JSON.stringify(attemptData)); // 1 hour expiry

  ```
} catch (error) {
  console.error('Error recording failed login:', error);
}
```

}

  /**

   - Clear login attempts on successful login
   */
  async clearLoginAttempts(identifier: string): Promise<void> {
    try {
      const key = `${LOGIN_ATTEMPTS_PREFIX}${identifier}`;
      await redis.del(key);
    } catch (error) {
      console.error(‘Error clearing login attempts:’, error);
    }
  }

  /**

   - Password reset rate limiting
   */
  async checkPasswordResetAttempts(email: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
  }> {
    try {
      const key = `${PASSWORD_RESET_PREFIX}${email}`;
      const attemptDataStr = await redis.get(key);

      const maxAttempts = 3;
      const windowDuration = 60 * 60; // 1 hour

      if (!attemptDataStr) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1
    };
  }

  const attemptData: LoginAttempt = JSON.parse(attemptDataStr);
  const now = Date.now();

  // Reset if window expired
  if (now - attemptData.lastAttempt > windowDuration * 1000) {
    await redis.del(key);
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1
    };
  }

  // Check if max attempts reached
  if (attemptData.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attemptData.lastAttempt + (windowDuration * 1000)
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attemptData.count - 1
  };

  ```
} catch (error) {
  console.error('Error checking password reset attempts:', error);
  return {
    allowed: true,
    remainingAttempts: 0
  };
}
```

}

  /**

   - Record password reset attempt
   */
  async recordPasswordResetAttempt(email: string): Promise<void> {
    try {
      const key = `${PASSWORD_RESET_PREFIX}${email}`;
      const attemptDataStr = await redis.get(key);
      const now = Date.now();

      let attemptData: LoginAttempt;
  if (attemptDataStr) {
    attemptData = JSON.parse(attemptDataStr);
    attemptData.count++;
    attemptData.lastAttempt = now;
  } else {
    attemptData = {
      count: 1,
      lastAttempt: now
    };
  }

  await redis.setex(key, 60 * 60, JSON.stringify(attemptData)); // 1 hour expiry

  ```
} catch (error) {
  console.error('Error recording password reset attempt:', error);
}
```

}

  /**

   - Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = ‘abcdefghijklmnopqrstuvwxyz’;
    const uppercase = ‘ABCDEFGHIJKLMNOPQRSTUVWXYZ’;
    const numbers = ‘0123456789’;
    const symbols = ’!@#$%^&*()_+-=[]{}|;:,.<>?’;

    ```
const allChars = lowercase + uppercase + numbers + symbols;
let password = '';

// Ensure at least one character from each category
password += lowercase[Math.floor(Math.random() * lowercase.length)];
password += uppercase[Math.floor(Math.random() * uppercase.length)];
password += numbers[Math.floor(Math.random() * numbers.length)];
password += symbols[Math.floor(Math.random() * symbols.length)];

// Fill the rest randomly
for (let i = 4; i < length; i++) {
  password += allChars[Math.floor(Math.random() * allChars.length)];
}

// Shuffle the password
return password.split('').sort(() => Math.random() - 0.5).join('');
```

  }

  /**

   - Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    ```
// Length check
if (password.length >= 8) {
  score += 1;
} else {
  feedback.push('Password must be at least 8 characters long');
}

if (password.length >= 12) {
  score += 1;
}

// Character variety checks
if (/[a-z]/.test(password)) {
  score += 1;
} else {
  feedback.push('Password must contain lowercase letters');
}

if (/[A-Z]/.test(password)) {
  score += 1;
} else {
  feedback.push('Password must contain uppercase letters');
}

if (/\d/.test(password)) {
  score += 1;
} else {
  feedback.push('Password must contain numbers');
}

if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
  score += 1;
} else {
  feedback.push('Password must contain special characters');
}

// Common patterns check
const commonPatterns = [
  /123456/,
  /password/i,
  /qwerty/i,
  /admin/i,
  /letmein/i
];

const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
if (hasCommonPattern) {
  score -= 2;
  feedback.push('Password contains common patterns');
}

return {
  isValid: score >= 4 && feedback.length === 0,
  score: Math.max(0, score),
  feedback
};
```

  }

  /**

   - Log analytics event
   */
  async logAnalyticsEvent(eventData: AnalyticsEventData): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: eventData.userId,
          eventName: eventData.eventName,
          eventType: eventData.eventType,
          category: eventData.category || ‘authentication’,
  properties: eventData.properties || {},
    sessionId: eventData.sessionId,
    deviceId: eventData.deviceId,
    ipAddress: eventData.ipAddress,
    userAgent: eventData.userAgent,
    country: eventData.country,
    region: eventData.region,
    city: eventData.city,
    timestamp: new Date(),
    serverTimestamp: new Date()
}
});
} catch (error) {
    console.error(‘Error logging analytics event:’, error);
    // Don’t throw error to prevent analytics from breaking auth flow
  }
}

  /**

   - Hash password with bcrypt
   */
  async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  /**

   - Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**

   - Generate cryptographically secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString(‘hex’);
  }

  /**

   - Generate secure UUID
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }

  /**

   - Extract device info from user agent
   */
  parseUserAgent(userAgent: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? ‘mobile’ : ‘desktop’;

    ```
let browser = 'unknown';
if (userAgent.includes('Chrome')) browser = 'chrome';
else if (userAgent.includes('Firefox')) browser = 'firefox';
else if (userAgent.includes('Safari')) browser = 'safari';
else if (userAgent.includes('Edge')) browser = 'edge';

let os = 'unknown';
if (userAgent.includes('Windows')) os = 'windows';
else if (userAgent.includes('Mac')) os = 'macos';
else if (userAgent.includes('Linux')) os = 'linux';
else if (userAgent.includes('Android')) os = 'android';
else if (userAgent.includes('iOS')) os = 'ios';

return { deviceType, browser, os };
```

  }

  /**

   - Cleanup expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const pattern = `${USER_SESSIONS_PREFIX}*`;
      const keys = await redis.keys(pattern);

      for (const key of keys) {
    const sessions = await redis.hgetall(key);
    const userId = key.replace(USER_SESSIONS_PREFIX, ‘’);

    let hasValidSessions = false;
    const pipeline = redis.pipeline();

    for (const [sessionId, sessionDataStr] of Object.entries(sessions)) {
      try {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        const sessionAge = Date.now() - sessionData.lastUsed;

        ```
     // Remove sessions older than 30 days
     if (sessionAge > 30 * 24 * 60 * 60 * 1000) {
       pipeline.hdel(key, sessionId);

       // Also remove corresponding refresh token
       const tokenPattern = `${REFRESH_TOKEN_PREFIX}*`;
       const tokenKeys = await redis.keys(tokenPattern);

       for (const tokenKey of tokenKeys) {
         const tokenDataStr = await redis.get(tokenKey);
         if (tokenDataStr) {
           const tokenData: SessionData = JSON.parse(tokenDataStr);
           if (tokenData.userId === userId && tokenData.sessionId === sessionId) {
             pipeline.del(tokenKey);
             break;
           }
         }
       }
     } else {
       hasValidSessions = true;
     }
   } catch (parseError) {
     // Remove invalid session data
     pipeline.hdel(key, sessionId);
   }
  ```

      }

      // Remove user sessions key if no valid sessions remain
      if (!hasValidSessions) {
        pipeline.del(key);
      }

      await pipeline.exec();
    }

    console.log(‘Session cleanup completed’);
  } catch (error) {
    console.error(‘Error cleaning up expired sessions:’, error);
  }
}

  /**

   - Get authentication statistics
   */
  async getAuthStats(timeframe: ‘day’ | ‘week’ | ‘month’ = ‘day’): Promise<{
    totalLogins: number;
    uniqueUsers: number;
    failedAttempts: number;
    registrations: number;
  }> {
    try {
      const now = new Date();
      let startDate: Date;

  switch (timeframe) {
    case ‘day’:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case ‘week’:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case ‘month’:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const [loginEvents, registrationEvents] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        eventName: ‘user_logged_in’,
  timestamp: { gte: startDate }
},
  select: { userId: true }
}),
  prisma.analyticsEvent.findMany({
    where: {
      eventName: ‘user_registered’,
  timestamp: { gte: startDate }
}
})
]);

  const uniqueUsers = new Set(loginEvents.map(event => event.userId)).size;

  // Get failed attempts from Redis (approximate)
  const failedAttemptKeys = await redis.keys(`${LOGIN_ATTEMPTS_PREFIX}*`);
  let failedAttempts = 0;

  for (const key of failedAttemptKeys) {
    const attemptDataStr = await redis.get(key);
    if (attemptDataStr) {
      const attemptData: LoginAttempt = JSON.parse(attemptDataStr);
      if (now.getTime() - attemptData.lastAttempt < (timeframe === ‘day’ ? 24 * 60 * 60 * 1000 :
        timeframe === ‘week’ ? 7 * 24 * 60 * 60 * 1000 :
        30 * 24 * 60 * 60 * 1000)) {
        failedAttempts += attemptData.count;
      }
    }
  }

  return {
    totalLogins: loginEvents.length,
    uniqueUsers,
    failedAttempts,
    registrations: registrationEvents.length
  };

  ```
} catch (error) {
  console.error('Error getting auth stats:', error);
  return {
    totalLogins: 0,
    uniqueUsers: 0,
    failedAttempts: 0,
    registrations: 0
  };
}
```

}
}

// Export singleton instance
  export const authService = new AuthService();

  export default authService;
