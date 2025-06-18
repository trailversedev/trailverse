import { z } from ‘zod’;
import dotenv from ‘dotenv’;
import path from ‘path’;

// Load environment variables from .env files
const loadEnvFiles = () => {
  const nodeEnv = process.env.NODE_ENV || ‘development’;

// Load .env files in order of precedence
  const envFiles = [
‘.env.local’,
  `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
‘.env’,
];

  envFiles.forEach(file => {
    const envPath = path.resolve(process.cwd(), file);
    dotenv.config({ path: envPath });
  });
};

// Load environment variables
loadEnvFiles();

// Environment validation schema
const envSchema = z.object({
// ===============================
// 🌐 CORE ENVIRONMENT
// ===============================
  NODE_ENV: z.enum([‘development’, ‘test’, ‘staging’, ‘production’]).default(‘development’),
PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(‘3001’),
API_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default(‘http://localhost:3000’),

// ===============================
// 🗄️ DATABASE CONFIGURATION
// ===============================
  DATABASE_URL: z.string().min(1, ‘Database URL is required’),
POSTGRES_DB: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),

// MongoDB for analytics and logs
  MONGODB_URI: z.string().optional(),

// Redis for caching and sessions
  REDIS_URL: z.string().default(‘redis://localhost:6379’),
  REDIS_HOST: z.string().default(‘localhost’),
REDIS_PORT: z.string().transform(Number).pipe(z.number().positive()).default(‘6379’),
REDIS_PASSWORD: z.string().optional(),

// ===============================
// 🔐 AUTHENTICATION & SECURITY
// ===============================
  JWT_SECRET: z.string().min(32, ‘JWT secret must be at least 32 characters’),
JWT_REFRESH_SECRET: z.string().min(32, ‘JWT refresh secret must be at least 32 characters’),
JWT_EXPIRES_IN: z.string().default(‘24h’),
JWT_REFRESH_EXPIRES_IN: z.string().default(‘7d’),

SESSION_SECRET: z.string().min(32, ‘Session secret must be at least 32 characters’),
ENCRYPTION_KEY: z.string().length(32, ‘Encryption key must be exactly 32 characters’),

// OAuth providers
GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

// ===============================
// 🗺️ MAPS & LOCATION SERVICES
// ===============================
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  MAPBOX_SECRET_TOKEN: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

// ===============================
// ☁️ WEATHER SERVICES
// ===============================
  OPENWEATHER_API_KEY: z.string().optional(),
  WEATHERAPI_KEY: z.string().optional(),

// ===============================
// 📧 EMAIL & NOTIFICATIONS
// ===============================
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),

  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),

// Push notifications
  FIREBASE_SERVER_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

// ===============================
// 🤖 AI & ML SERVICES
// ===============================
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORGANIZATION: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_TOKEN: z.string().optional(),
  ML_API_URL: z.string().url().optional(),
  ML_API_KEY: z.string().optional(),

// ===============================
// ☁️ CLOUD STORAGE
// ===============================
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default(‘us-east-1’),
AWS_S3_BUCKET: z.string().optional(),

// ===============================
// 📊 ANALYTICS & MONITORING
// ===============================
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_APP_KEY: z.string().optional(),

// ===============================
// 💳 PAYMENT PROCESSING
// ===============================
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

// ===============================
// 🏛️ GOVERNMENT APIs
// ===============================
  NPS_API_KEY: z.string().optional(),

// ===============================
// 📱 MOBILE & AR
// ===============================
  EXPO_ACCESS_TOKEN: z.string().optional(),
  AR_CLOUD_API_KEY: z.string().optional(),

// ===============================
// 🔄 REALTIME FEATURES
// ===============================
  WEBSOCKET_PORT: z.string().transform(Number).pipe(z.number().positive()).default(‘3002’),
WEBSOCKET_SECRET: z.string().optional(),
  SOCKET_IO_CORS_ORIGIN: z.string().default(‘http://localhost:3000’),

// ===============================
// 📈 FEATURE FLAGS
// ===============================
  ENABLE_AI_FEATURES: z.string().transform(val => val === ‘true’).default(‘true’),
ENABLE_AR_FEATURES: z.string().transform(val => val === ‘true’).default(‘true’),
ENABLE_VOICE_TOURS: z.string().transform(val => val === ‘true’).default(‘true’),
ENABLE_SOCIAL_FEATURES: z.string().transform(val => val === ‘true’).default(‘true’),
ENABLE_PAYMENT_FEATURES: z.string().transform(val => val === ‘true’).default(‘false’),
ENABLE_OFFLINE_MODE: z.string().transform(val => val === ‘true’).default(‘true’),

// ===============================
// 🔧 DEVELOPMENT
// ===============================
DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum([‘error’, ‘warn’, ‘info’, ‘debug’]).default(‘info’),
ENABLE_CORS: z.string().transform(val => val === ‘true’).default(‘true’),
ENABLE_MORGAN_LOGGING: z.string().transform(val => val === ‘true’).default(‘true’),
BYPASS_AUTH: z.string().transform(val => val === ‘true’).default(‘false’),

// ===============================
// 🚀 DEPLOYMENT
// ===============================
VERCEL_TOKEN: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  RAILWAY_TOKEN: z.string().optional(),
  DOCKER_REGISTRY: z.string().optional(),
  DOCKER_IMAGE_TAG: z.string().default(‘latest’),

// ===============================
// 🔑 API KEYS & SECRETS
// ===============================
VALID_API_KEYS: z.string().optional(),
  INTERNAL_API_SECRET: z.string().optional(),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(‘❌ Environment validation failed:’);
    error.errors.forEach(err => {
      console.error(`  • ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Environment configuration object
export const config = {
// Core environment
  env: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === ‘development’,
isProduction: env.NODE_ENV === ‘production’,
isTest: env.NODE_ENV === ‘test’,
isStaging: env.NODE_ENV === ‘staging’,
apiUrl: env.API_URL || `http://localhost:${env.PORT}`,
  frontendUrl: env.FRONTEND_URL,

// Database configuration
  database: {
  url: env.DATABASE_URL,
    postgres: {
    db: env.POSTGRES_DB,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
  },
  mongodb: {
    uri: env.MONGODB_URI,
  },
  redis: {
    url: env.REDIS_URL,
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
  },
},

// Authentication configuration
auth: {
  jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    sessionSecret: env.SESSION_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    facebook: {
      appId: env.FACEBOOK_APP_ID,
        appSecret: env.FACEBOOK_APP_SECRET,
    },
  },
},

// External services
services: {
  maps: {
    mapbox: {
      accessToken: env.MAPBOX_ACCESS_TOKEN,
        secretToken: env.MAPBOX_SECRET_TOKEN,
    },
    google: {
      mapsApiKey: env.GOOGLE_MAPS_API_KEY,
        placesApiKey: env.GOOGLE_PLACES_API_KEY,
    },
  },
  weather: {
    openWeather: {
      apiKey: env.OPENWEATHER_API_KEY,
    },
    weatherApi: {
      key: env.WEATHERAPI_KEY,
    },
  },
  email: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL,
        fromName: env.SENDGRID_FROM_NAME,
    },
    mailgun: {
      apiKey: env.MAILGUN_API_KEY,
        domain: env.MAILGUN_DOMAIN,
    },
  },
  notifications: {
    firebase: {
      serverKey: env.FIREBASE_SERVER_KEY,
        projectId: env.FIREBASE_PROJECT_ID,
    },
    vapid: {
      publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
    },
  },
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
        organization: env.OPENAI_ORGANIZATION,
    },
    google: {
      apiKey: env.GOOGLE_AI_API_KEY,
    },
    huggingface: {
      token: env.HUGGINGFACE_API_TOKEN,
    },
    custom: {
      apiUrl: env.ML_API_URL,
        apiKey: env.ML_API_KEY,
    },
  },
  storage: {
    cloudinary: {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
    },
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION,
        s3Bucket: env.AWS_S3_BUCKET,
    },
  },
  analytics: {
    googleAnalytics: {
      measurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
    mixpanel: {
      token: env.MIXPANEL_TOKEN,
    },
    sentry: {
      dsn: env.SENTRY_DSN,
        publicDsn: env.NEXT_PUBLIC_SENTRY_DSN,
    },
    datadog: {
      apiKey: env.DATADOG_API_KEY,
        appKey: env.DATADOG_APP_KEY,
    },
  },
  payments: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
        publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: env.PAYPAL_CLIENT_ID,
        clientSecret: env.PAYPAL_CLIENT_SECRET,
    },
  },
  government: {
    nps: {
      apiKey: env.NPS_API_KEY,
    },
  },
  mobile: {
    expo: {
      accessToken: env.EXPO_ACCESS_TOKEN,
    },
    ar: {
      cloudApiKey: env.AR_CLOUD_API_KEY,
    },
  },
},

// Real-time configuration
realtime: {
  websocket: {
    port: env.WEBSOCKET_PORT,
      secret: env.WEBSOCKET_SECRET,
  },
  socketio: {
    corsOrigin: env.SOCKET_IO_CORS_ORIGIN,
  },
},

// Feature flags
features: {
  ai: env.ENABLE_AI_FEATURES,
    ar: env.ENABLE_AR_FEATURES,
    voiceTours: env.ENABLE_VOICE_TOURS,
    social: env.ENABLE_SOCIAL_FEATURES,
    payments: env.ENABLE_PAYMENT_FEATURES,
    offline: env.ENABLE_OFFLINE_MODE,
},

// Development configuration
development: {
  debug: env.DEBUG,
    logLevel: env.LOG_LEVEL,
    enableCors: env.ENABLE_CORS,
    enableMorganLogging: env.ENABLE_MORGAN_LOGGING,
    bypassAuth: env.BYPASS_AUTH,
},

// Deployment configuration
deployment: {
  vercel: {
    token: env.VERCEL_TOKEN,
      orgId: env.VERCEL_ORG_ID,
      projectId: env.VERCEL_PROJECT_ID,
  },
  railway: {
    token: env.RAILWAY_TOKEN,
  },
  docker: {
    registry: env.DOCKER_REGISTRY,
      imageTag: env.DOCKER_IMAGE_TAG,
  },
},

// Security configuration
security: {
  validApiKeys: env.VALID_API_KEYS?.split(’,’) || [],
    internalApiSecret: env.INTERNAL_API_SECRET,
},
};

// Configuration validation helpers
export class ConfigValidator {
  /**

   - Validate required configuration for specific features
   */
  static validateFeatureConfig(feature: keyof typeof config.features): boolean {
    if (!config.features[feature]) {
      return true; // Feature is disabled, so config is valid
    }

    ```
switch (feature) {
  case 'ai':
    return !!(
      config.services.ai.openai.apiKey ||
      config.services.ai.google.apiKey ||
      config.services.ai.custom.apiUrl
    );

  case 'payments':
    return !!(
      config.services.payments.stripe.secretKey ||
      config.services.payments.paypal.clientId
    );

  case 'social':
    return !!(
      config.auth.oauth.google.clientId ||
      config.auth.oauth.github.clientId ||
      config.auth.oauth.facebook.appId
    );

  default:
    return true;
}
```

  }

  /**

   - Validate all enabled features
   */
  static validateAllFeatures(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    ```
Object.keys(config.features).forEach(feature => {
  if (!this.validateFeatureConfig(feature as keyof typeof config.features)) {
    errors.push(`Feature '${feature}' is enabled but missing required configuration`);
  }
});

return {
  valid: errors.length === 0,
  errors,
};
```

  }

  /**

   - Check if environment is properly configured for production
   */
  static validateProductionConfig(): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    ```
if (config.isProduction) {
  // Critical production checks
  if (!config.services.email.sendgrid.apiKey && !config.services.email.mailgun.apiKey) {
    errors.push('Email service not configured for production');
  }

  if (!config.services.analytics.sentry.dsn) {
    warnings.push('Error tracking (Sentry) not configured');
  }

  if (!config.services.storage.cloudinary.apiKey && !config.services.storage.aws.accessKeyId) {
    warnings.push('Cloud storage not configured');
  }

  if (config.development.bypassAuth) {
    errors.push('Auth bypass is enabled in production');
  }

  // Security checks
  if (config.auth.jwtSecret.length < 64) {
    warnings.push('JWT secret should be at least 64 characters in production');
  }

  if (!config.services.analytics.googleAnalytics.measurementId) {
    warnings.push('Google Analytics not configured');
  }
}

return {
  valid: errors.length === 0,
  warnings,
  errors,
};
```

  }
}

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const baseConfig = {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    session: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  switch (config.env) {
    case ‘development’:
      return {
…baseConfig,
      cors: {
    …baseConfig.cors,
        origin: [config.frontendUrl, ‘http://localhost:3000’, ‘http://localhost:3001’],
    },
      rateLimiting: {
      …baseConfig.rateLimiting,
          max: 1000, // More lenient in development
      },
      logging: {
        level: ‘debug’,
        format: ‘dev’,
      },
  };

  ```
case 'test':
  return {
    ...baseConfig,
    rateLimiting: {
      ...baseConfig.rateLimiting,
      max: 10000, // Very lenient for tests
    },
    logging: {
      level: 'error',
      format: 'minimal',
    },
  };

case 'staging':
  return {
    ...baseConfig,
    cors: {
      ...baseConfig.cors,
      origin: ['https://staging.trailverse.com', config.frontendUrl],
    },
    session: {
      ...baseConfig.session,
      secure: true,
    },
    logging: {
      level: 'info',
      format: 'combined',
    },
  };

case 'production':
  return {
    ...baseConfig,
    cors: {
      ...baseConfig.cors,
      origin: ['https://trailverse.com', 'https://www.trailverse.com'],
    },
    rateLimiting: {
      ...baseConfig.rateLimiting,
      max: 50, // More restrictive in production
    },
    session: {
      ...baseConfig.session,
      secure: true,
    },
    logging: {
      level: 'error',
      format: 'combined',
    },
  };

default:
  return baseConfig;
```

}
};

// Configuration health check
export const performConfigHealthCheck = (): {
  status: ‘healthy’ | ‘warning’ | ‘error’;
  message: string;
  details: {
    environment: string;
    featuresValidation: ReturnType<typeof ConfigValidator.validateAllFeatures>;
    productionValidation?: ReturnType<typeof ConfigValidator.validateProductionConfig>;
    missingOptionalServices: string[];
  };
} => {
  const featuresValidation = ConfigValidator.validateAllFeatures();
  const productionValidation = config.isProduction
    ? ConfigValidator.validateProductionConfig()
    : undefined;

// Check for missing optional services
  const missingOptionalServices: string[] = [];

  if (!config.services.weather.openWeather.apiKey) {
    missingOptionalServices.push(‘OpenWeather API’);
  }

  if (!config.services.maps.mapbox.accessToken) {
    missingOptionalServices.push(‘Mapbox’);
  }

  if (!config.services.ai.openai.apiKey) {
    missingOptionalServices.push(‘OpenAI’);
  }

// Determine overall status
  let status: ‘healthy’ | ‘warning’ | ‘error’ = ‘healthy’;
  let message = ‘Configuration is valid’;

  if (!featuresValidation.valid || (productionValidation && !productionValidation.valid)) {
    status = ‘error’;
    message = ‘Configuration has critical errors’;
  } else if (
    missingOptionalServices.length > 0 ||
    (productionValidation && productionValidation.warnings.length > 0)
  ) {
    status = ‘warning’;
    message = ‘Configuration has warnings but is functional’;
  }

  return {
    status,
    message,
    details: {
      environment: config.env,
      featuresValidation,
      productionValidation,
      missingOptionalServices,
    },
  };
};

// Utility functions
export const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

export const getOptionalEnvVar = (name: string, defaultValue?: string): string | undefined => {
  return process.env[name] || defaultValue;
};

export const getBooleanEnvVar = (name: string, defaultValue: boolean = false): boolean => {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === ‘true’;
};

export const getNumberEnvVar = (name: string, defaultValue?: number): number | undefined => {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
};

// Export types for TypeScript
export type Config = typeof config;
export type Environment = typeof config.env;
export type FeatureFlags = typeof config.features;

// Export default configuration
export default config;
