// Server Configuration
import { config } from 'dotenv'

// Load environment variables
config()

export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL!,
    redis: {
      url: process.env.REDIS_URL!,
    },
    mongodb: {
      uri: process.env.MONGODB_URI!,
    },
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  // External APIs
  external: {
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY!,
    },
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY!,
    },
    nps: {
      apiKey: process.env.NPS_API_KEY!,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    },
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_PASSWORD!,
    },
  },

  // AI/ML
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
    },
    huggingFace: {
      apiKey: process.env.HUGGINGFACE_API_KEY!,
    },
  },

  // Feature flags
  features: {
    enableAI: process.env.ENABLE_AI_RECOMMENDATIONS === 'true',
    enableAR: process.env.ENABLE_AR_FEATURES === 'true',
    enableVoice: process.env.ENABLE_VOICE_FEATURES === 'true',
    enableRealTime: process.env.ENABLE_REAL_TIME_UPDATES === 'true',
  },

  // Security
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

export default SERVER_CONFIG

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET']

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`)
  })
  process.exit(1)
}
