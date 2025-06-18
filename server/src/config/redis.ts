// server/src/config/redis.ts
import Redis from 'ioredis';

// Redis configuration for Docker container
const redisConfig = {
  host: process.env.REDIS_HOST || 'trailverse-redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  lazyConnect: true,
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000'),
  family: 4,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'trailverse:',
};

// Create Redis instance with proper error handling
export const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('🚀 Redis is ready to accept commands');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});

// Helper functions for common Redis operations
export const RedisKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  tokenVersion: (userId: string) => `token_version:${userId}`,
  rateLimit: (key: string) => `rate_limit:${key}`,
  accountLockout: (identifier: string) => `lockout:${identifier}`,
  emailVerification: (token: string) => `email_verify:${token}`,
  passwordReset: (token: string) => `password_reset:${token}`,
  userPreferences: (userId: string) => `user_prefs:${userId}`,
  parkCache: (parkId: string) => `park:${parkId}`,
  searchCache: (query: string) => `search:${query}`,
  weatherCache: (parkId: string) => `weather:${parkId}`,
  crowdData: (parkId: string) => `crowd:${parkId}`
};

// Helper functions for common operations
export const RedisHelpers = {
  // Set with TTL
  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  // Get and parse JSON
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error parsing JSON from Redis key ${key}:`, error);
      return null;
    }
  },

  // Set JSON with TTL
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  // Increment with expiration
  async incrWithExpire(key: string, ttlSeconds: number): Promise<number> {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttlSeconds);
    const results = await pipeline.exec();
    return results?.[0]?.[1] as number || 0;
  },

  // Delete multiple keys by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  // Get TTL of a key
  async getTTL(key: string): Promise<number> {
    return await redis.ttl(key);
  }
};

// Connection health check
export const checkRedisHealth = async (): Promise<{ connected: boolean; latency?: number }> => {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    return { connected: true, latency };
  } catch (error) {
    console.error('Redis health check failed:', error);
    return { connected: false };
  }
};

// Graceful shutdown
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
};

export default redis;
