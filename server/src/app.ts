// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import configuration and utilities
import { config, getEnvironmentConfig, performConfigHealthCheck } from './config/environment';
import { prisma, dbManager, DatabaseHelpers } from './config/database';
import { redis, checkRedisHealth } from './config/redis';
import { authService } from './services/authService';

// Import middleware
import {
  authenticateToken,
  optionalAuth,
  devBypassAuth,
  securityHeaders,
  ipRateLimit
} from './middleware/auth';
import {
  errorHandler,
  notFoundHandler,
  requestTrackingMiddleware,
  setupGlobalErrorHandlers
} from './middleware/errorHandler';

// Import routes (placeholders for now)
// import authRoutes from './routes/auth';
// import parksRoutes from './routes/parks';
// import usersRoutes from './routes/users';
// import reviewsRoutes from './routes/reviews';

// Initialize Express app
const app = express();
const server = createServer(app);

// Get environment-specific configuration
const envConfig = getEnvironmentConfig();

// Database and Redis are imported from config files
export { prisma, redis };

// Initialize Socket.IO for real-time features
export const io = new SocketIOServer(server, {
  cors: {
    origin: config.realtime.socketio.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ===============================
// 🔧 MIDDLEWARE CONFIGURATION
// ===============================

// Setup global error handlers for uncaught exceptions
setupGlobalErrorHandlers();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Request tracking (must be early in middleware chain)
app.use(requestTrackingMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Apply custom security headers
app.use(securityHeaders);

// CORS configuration using environment config
app.use(cors(envConfig.cors));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

// Cookie parsing
app.use(cookieParser());

// Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// Request logging using environment config
if (config.development.enableMorganLogging && config.env !== 'test') {
  app.use(morgan(envConfig.logging?.format || 'dev', {
    skip: (req, res) => {
      // Skip logging for health checks and static files
      return req.url === '/health' || req.url.startsWith('/static/');
    },
  }));
}

// Rate limiting using environment config
const limiter = rateLimit({
  windowMs: envConfig.rateLimiting.windowMs,
  max: envConfig.rateLimiting.max,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.url === '/health' || req.url.startsWith('/static/');
  },
});

app.use('/api/', limiter);

// Speed limiting (slow down repeated requests)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests at full speed
  delayMs: 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 2000, // Max delay of 2 seconds
});

app.use('/api/', speedLimiter);

// HTTP Parameter Pollution protection
app.use(hpp({
  whitelist: ['tags', 'activities', 'amenities', 'features'],
}));

// Development bypass for auth (only in development)
if (config.development.bypassAuth) {
  app.use(devBypassAuth);
}

// ===============================
// 🏥 HEALTH CHECK ENDPOINTS
// ===============================

app.get('/health', async (req, res) => {
  try {
    // Use your powerful database health check and config validation
    const [dbHealth, redisHealth, configHealth] = await Promise.all([
      dbManager.healthCheck(),
      checkRedisHealth(),
      Promise.resolve(performConfigHealthCheck())
    ]);

    const isHealthy = dbHealth.status === 'healthy' &&
      redisHealth.connected &&
      configHealth.status !== 'error';

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      services: {
        database: {
          status: dbHealth.status,
          responseTime: `${dbHealth.responseTime}ms`,
          error: dbHealth.error
        },
        redis: {
          status: redisHealth.connected ? 'connected' : 'disconnected',
          responseTime: redisHealth.latency ? `${redisHealth.latency}ms` : undefined
        },
        api: 'running',
      },
      configuration: {
        status: configHealth.status,
        message: configHealth.message,
        enabledFeatures: Object.entries(config.features)
          .filter(([, enabled]) => enabled)
          .map(([feature]) => feature)
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

app.get('/health/detailed', authenticateToken, async (req, res) => {
  try {
    // Use your comprehensive utilities and config validation
    const [dbHealth, redisHealth, dbStats, configHealth, memoryUsage] = await Promise.all([
      dbManager.healthCheck(),
      checkRedisHealth(),
      DatabaseHelpers.getDatabaseStats().catch(() => null), // Non-critical
      Promise.resolve(performConfigHealthCheck()),
      process.memoryUsage(),
    ]);

    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        name: config.env,
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      services: {
        database: {
          status: dbHealth.status,
          responseTime: `${dbHealth.responseTime}ms`,
          error: dbHealth.error,
          statistics: dbStats
        },
        redis: {
          status: redisHealth.connected ? 'connected' : 'disconnected',
          responseTime: redisHealth.latency ? `${redisHealth.latency}ms` : undefined
        },
      },
      configuration: {
        status: configHealth.status,
        message: configHealth.message,
        details: configHealth.details,
        enabledFeatures: config.features,
        missingServices: configHealth.details.missingOptionalServices
      },
      performance: {
        memory: memoryUsage,
        uptime: process.uptime(),
        cpu: process.cpuUsage(),
      },
    });
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===============================
// 📡 API ROUTES
// ===============================

// API version info
app.get('/api', (req, res) => {
  res.json({
    name: 'Trailverse API',
    version: '1.0.0',
    description: 'AI-powered National Parks Explorer API',
    documentation: '/api/docs',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      parks: '/api/parks',
      users: '/api/users',
      reviews: '/api/reviews',
      trips: '/api/trips',
      community: '/api/community',
      ai: '/api/ai',
      weather: '/api/weather',
      analytics: '/api/analytics',
      admin: '/api/admin',
    },
  });
});

// Basic routes for testing (will be replaced with actual route files)
app.get('/', (req, res) => {
  res.json({
    message: '🏞️ Trailverse API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      parks: '/api/parks',
      reviews: '/api/reviews'
    }
  });
});

// Database test endpoints using your powerful utilities
app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true
        }
      }),
      () => prisma.user.count(),
      page,
      limit
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/parks', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    let whereClause = {};

    // Use your powerful search utility
    if (search) {
      whereClause = DatabaseHelpers.buildWhereClause({
        name: search,
        description: search,
        state: search
      });
    }

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.park.findMany({
        skip,
        take,
        where: whereClause,
        select: {
          id: true,
          name: true,
          state: true,
          description: true,
          images: true,
          activities: true,
          coordinates: true,
          popularityScore: true,
          crowdLevel: true,
          createdAt: true
        },
        orderBy: { popularityScore: 'desc' }
      }),
      () => prisma.park.count({ where: whereClause }),
      page,
      limit
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mount API routes (uncomment when route files are created)
// app.use('/api/auth', authRoutes);
// app.use('/api/parks', parksRoutes);
// app.use('/api/users', optionalAuth, usersRoutes);
// app.use('/api/reviews', optionalAuth, reviewsRoutes);

// API documentation (placeholder)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    swagger: '/api/docs/swagger',
    postman: '/api/docs/postman',
    version: '1.0.0',
  });
});

// Auth statistics endpoint (admin only)
app.get('/api/auth/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month') || 'day';
    const stats = await authService.getAuthStats(timeframe);

    res.json({
      success: true,
      data: stats,
      timeframe,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch auth statistics'
    });
  }
});

// ===============================
// 🌐 WEBSOCKET CONFIGURATION
// ===============================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT token (simplified for WebSocket)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.userRole = user.role;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected via WebSocket`);

  // Join user-specific room for notifications
  socket.join(`user:${socket.userId}`);

  // Handle real-time features
  socket.on('join-park', (parkId: string) => {
    socket.join(`park:${parkId}`);
    console.log(`User ${socket.userId} joined park room: ${parkId}`);
  });

  socket.on('leave-park', (parkId: string) => {
    socket.leave(`park:${parkId}`);
    console.log(`User ${socket.userId} left park room: ${parkId}`);
  });

  socket.on('crowd-report', async (data) => {
    try {
      // Handle real-time crowd reporting
      await handleCrowdReport(socket.userId!, data);
      io.to(`park:${data.parkId}`).emit('crowd-update', data);
    } catch (error) {
      socket.emit('error', { message: 'Failed to process crowd report' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.userId} disconnected: ${reason}`);
  });
});

// ===============================
// 🚫 ERROR HANDLING
// ===============================

// Handle 404 errors using your comprehensive handler
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ===============================
// 🔄 GRACEFUL SHUTDOWN
// ===============================

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close WebSocket connections
  io.close(() => {
    console.log('WebSocket server closed');
  });

  try {
    // Use your database manager for graceful shutdown
    await dbManager.disconnect();
    console.log('Database connections closed');

    // Close Redis connection
    await redis.quit();
    console.log('Redis connection closed');

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Remove old helper functions since we're using database.ts utilities
// The database.ts file provides all these utilities and more!

async function handleCrowdReport(userId: string, data: any) {
  try {
    // Store crowd report in database (when CrowdData model is available)
    console.log(`Crowd report from user ${userId}:`, data);

    // TODO: Implement when Prisma schema includes CrowdData model
    // await prisma.crowdData.create({
    //   data: {
    //     parkId: data.parkId,
    //     crowdLevel: data.crowdLevel,
    //     capacity: data.capacity,
    //     area: data.area,
    //     source: 'USER_REPORT',
    //     confidence: 0.7,
    //     recordedAt: new Date(),
    //     validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    //   },
    // });
  } catch (error) {
    console.error('Error handling crowd report:', error);
    throw error;
  }
}

// ===============================
// 🚀 SERVER STARTUP
// ===============================

const PORT = config.port;

async function startServer() {
  try {
    // Validate configuration on startup
    const configHealth = performConfigHealthCheck();
    if (configHealth.status === 'error') {
      console.error('❌ Configuration validation failed:');
      configHealth.details.featuresValidation.errors.forEach(error => {
        console.error(`  • ${error}`);
      });
      if (configHealth.details.productionValidation) {
        configHealth.details.productionValidation.errors.forEach(error => {
          console.error(`  • ${error}`);
        });
      }
      process.exit(1);
    }

    if (configHealth.status === 'warning') {
      console.warn('⚠️  Configuration warnings:');
      if (configHealth.details.missingOptionalServices.length > 0) {
        console.warn(`  • Missing optional services: ${configHealth.details.missingOptionalServices.join(', ')}`);
      }
      if (configHealth.details.productionValidation) {
        configHealth.details.productionValidation.warnings.forEach(warning => {
          console.warn(`  • ${warning}`);
        });
      }
    }

    // Use your database manager for connection
    await dbManager.connect();
    console.log('✅ Database connected successfully');

    // Test Redis connection
    const redisHealth = await checkRedisHealth();
    if (redisHealth.connected) {
      console.log('✅ Redis connected successfully');
    } else {
      console.warn('⚠️  Redis connection failed, some features may be limited');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`
🚀 Trailverse API Server Started!

📡 Server: ${config.apiUrl}
🏥 Health: ${config.apiUrl}/health
📚 API Info: ${config.apiUrl}/api
🌍 Environment: ${config.env}
📊 Process ID: ${process.pid}

🎯 Features Enabled:
${Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => `  • ${feature}`)
        .join('\n')}

🎯 Ready to explore the trails! 🏞️
      `);
    });

    // Schedule cleanup tasks using your authService
    setInterval(async () => {
      try {
        console.log('Running scheduled cleanup tasks...');

        // Clean up expired sessions using your authService
        await authService.cleanupExpiredSessions();

        // Add other cleanup tasks here as needed
      } catch (error) {
        console.error('Cleanup task error:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, server, io };
export default app;
