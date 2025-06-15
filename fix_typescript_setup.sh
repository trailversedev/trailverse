#!/bin/bash

# 🔧 Fix Trailverse TypeScript Setup
# This script creates the missing TypeScript files and sets up proper compilation

echo "🔧 Fixing TypeScript compilation issues..."

# ===================================================================
# STEP 1: CREATE SHARED PACKAGE INDEX AND TYPES
# ===================================================================

echo "🔗 Setting up shared package..."

# Create shared index file
cat > shared/index.ts << 'EOF'
// Trailverse Shared Package
// Export all types, constants, and utilities

// Types
export * from './types'

// Constants
export * from './constants'

// Utils
export * from './utils'

// Schemas
export * from './schemas'
EOF

# Create shared types index
cat > shared/types/index.ts << 'EOF'
// Shared Types for Trailverse
export * from './api'
export * from './entities'
export * from './events'
EOF

# Create API types
cat > shared/types/api/index.ts << 'EOF'
// API Types

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// Request/Response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
  }
  token: string
}
EOF

# Create entity types
cat > shared/types/entities/index.ts << 'EOF'
// Entity Types

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  preferredActivities: string[]
  accessibilityNeeds: string[]
  crowdTolerance: 'low' | 'medium' | 'high'
  notificationSettings: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  weatherAlerts: boolean
  crowdUpdates: boolean
}

export interface Park {
  id: string
  name: string
  state: string
  description: string
  fullDescription?: string
  images: string[]
  activities: string[]
  coordinates: {
    lat: number
    lng: number
  }
  popularityScore: number
  crowdLevel: 'low' | 'medium' | 'high' | 'very-high'
  bestTimeToVisit: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Review {
  id: string
  userId: string
  parkId: string
  rating: number
  title: string
  content: string
  images?: string[]
  visitDate: Date
  createdAt: Date
  updatedAt: Date
  user: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface Trip {
  id: string
  userId: string
  name: string
  description?: string
  parks: string[] // Park IDs
  startDate: Date
  endDate: Date
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}
EOF

# Create event types
cat > shared/types/events/index.ts << 'EOF'
// Event Types for Real-time Features

export interface BaseEvent {
  id: string
  type: string
  timestamp: Date
  userId?: string
}

export interface CrowdUpdateEvent extends BaseEvent {
  type: 'crowd_update'
  parkId: string
  crowdLevel: 'low' | 'medium' | 'high' | 'very-high'
  visitorCount: number
}

export interface WeatherAlertEvent extends BaseEvent {
  type: 'weather_alert'
  parkId: string
  alertType: 'severe_weather' | 'closure' | 'advisory'
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface UserActivityEvent extends BaseEvent {
  type: 'user_activity'
  activityType: 'review_posted' | 'trip_shared' | 'photo_uploaded'
  resourceId: string
  resourceType: 'review' | 'trip' | 'photo'
}

export type TrailverseEvent = CrowdUpdateEvent | WeatherAlertEvent | UserActivityEvent
EOF

# Create shared constants
cat > shared/constants/index.ts << 'EOF'
// Shared Constants
export * from './api'
export * from './features'
export * from './validation'
EOF

cat > shared/constants/api/endpoints.ts << 'EOF'
// API Endpoints

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
  },

  // Parks
  PARKS: {
    LIST: '/parks',
    DETAIL: (id: string) => `/parks/${id}`,
    SEARCH: '/parks/search',
    POPULAR: '/parks/popular',
  },

  // Reviews
  REVIEWS: {
    LIST: (parkId: string) => `/parks/${parkId}/reviews`,
    CREATE: (parkId: string) => `/parks/${parkId}/reviews`,
    UPDATE: (reviewId: string) => `/reviews/${reviewId}`,
    DELETE: (reviewId: string) => `/reviews/${reviewId}`,
  },

  // Trips
  TRIPS: {
    LIST: '/trips',
    CREATE: '/trips',
    DETAIL: (id: string) => `/trips/${id}`,
    UPDATE: (id: string) => `/trips/${id}`,
    DELETE: (id: string) => `/trips/${id}`,
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    PREFERENCES: '/users/preferences',
  },
} as const
EOF

cat > shared/constants/features/flags.ts << 'EOF'
// Feature Flags

export const FEATURE_FLAGS = {
  AI_RECOMMENDATIONS: 'ai_recommendations',
  AR_FEATURES: 'ar_features',
  VOICE_FEATURES: 'voice_features',
  REAL_TIME_UPDATES: 'real_time_updates',
  SOCIAL_FEATURES: 'social_features',
  PAYMENT_FEATURES: 'payment_features',
  BETA_FEATURES: 'beta_features',
} as const

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  [FEATURE_FLAGS.AI_RECOMMENDATIONS]: true,
  [FEATURE_FLAGS.AR_FEATURES]: true,
  [FEATURE_FLAGS.VOICE_FEATURES]: true,
  [FEATURE_FLAGS.REAL_TIME_UPDATES]: true,
  [FEATURE_FLAGS.SOCIAL_FEATURES]: true,
  [FEATURE_FLAGS.PAYMENT_FEATURES]: false,
  [FEATURE_FLAGS.BETA_FEATURES]: false,
}
EOF

cat > shared/constants/validation/rules.ts << 'EOF'
// Validation Rules

export const VALIDATION_RULES = {
  USER: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
    EMAIL: {
      REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
      REQUIRE_SPECIAL: true,
    },
  },

  REVIEW: {
    TITLE: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 100,
    },
    CONTENT: {
      MIN_LENGTH: 20,
      MAX_LENGTH: 2000,
    },
    RATING: {
      MIN: 1,
      MAX: 5,
    },
  },

  TRIP: {
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    DESCRIPTION: {
      MAX_LENGTH: 500,
    },
    MAX_PARKS: 20,
    MAX_DURATION_DAYS: 365,
  },
} as const
EOF

# Create shared utils
cat > shared/utils/index.ts << 'EOF'
// Shared Utilities
export * from './validation'
export * from './formatting'
export * from './calculations'
EOF

cat > shared/utils/validation/index.ts << 'EOF'
// Validation Utilities
import { VALIDATION_RULES } from '../../constants/validation/rules'

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.USER.EMAIL.REGEX.test(email)
}

export const validatePassword = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  const rules = VALIDATION_RULES.USER.PASSWORD

  if (password.length < rules.MIN_LENGTH) {
    errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`)
  }

  if (password.length > rules.MAX_LENGTH) {
    errors.push(`Password must be less than ${rules.MAX_LENGTH} characters long`)
  }

  if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (rules.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (rules.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}
EOF

cat > shared/utils/formatting/index.ts << 'EOF'
// Formatting Utilities

export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDistance = (distanceInMiles: number): string => {
  if (distanceInMiles < 1) {
    return `${Math.round(distanceInMiles * 5280)} ft`
  }
  return `${distanceInMiles.toFixed(1)} mi`
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}m`
  }

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
EOF

cat > shared/utils/calculations/index.ts << 'EOF'
// Calculation Utilities

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, rating) => acc + rating, 0)
  return Math.round((sum / ratings.length) * 10) / 10 // Round to 1 decimal
}

export const calculateTripDuration = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // Days
}

export const calculateEstimatedTravelTime = (distanceInMiles: number): number => {
  // Assume average speed of 50 mph for estimation
  const avgSpeed = 50
  return Math.round((distanceInMiles / avgSpeed) * 60) // Minutes
}
EOF

# Create shared schemas
cat > shared/schemas/index.ts << 'EOF'
// Shared Schemas
export * from './api'
export * from './database'
export * from './events'
EOF

cat > shared/schemas/api/index.ts << 'EOF'
// API Schemas using Zod
import { z } from 'zod'
import { VALIDATION_RULES } from '../../constants/validation/rules'

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.USER.NAME.MIN_LENGTH, `Name must be at least ${VALIDATION_RULES.USER.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USER.NAME.MAX_LENGTH, `Name must be less than ${VALIDATION_RULES.USER.NAME.MAX_LENGTH} characters`),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH, `Password must be less than ${VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH} characters`),
})

// Review schemas
export const CreateReviewSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.REVIEW.TITLE.MIN_LENGTH)
    .max(VALIDATION_RULES.REVIEW.TITLE.MAX_LENGTH),
  content: z
    .string()
    .min(VALIDATION_RULES.REVIEW.CONTENT.MIN_LENGTH)
    .max(VALIDATION_RULES.REVIEW.CONTENT.MAX_LENGTH),
  rating: z
    .number()
    .int()
    .min(VALIDATION_RULES.REVIEW.RATING.MIN)
    .max(VALIDATION_RULES.REVIEW.RATING.MAX),
  visitDate: z.string().datetime(),
  images: z.array(z.string().url()).optional(),
})

// Trip schemas
export const CreateTripSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.TRIP.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.TRIP.NAME.MAX_LENGTH),
  description: z
    .string()
    .max(VALIDATION_RULES.TRIP.DESCRIPTION.MAX_LENGTH)
    .optional(),
  parks: z
    .array(z.string())
    .min(1, 'At least one park is required')
    .max(VALIDATION_RULES.TRIP.MAX_PARKS, `Maximum ${VALIDATION_RULES.TRIP.MAX_PARKS} parks allowed`),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPublic: z.boolean().default(false),
})

export type LoginRequest = z.infer<typeof LoginSchema>
export type RegisterRequest = z.infer<typeof RegisterSchema>
export type CreateReviewRequest = z.infer<typeof CreateReviewSchema>
export type CreateTripRequest = z.infer<typeof CreateTripSchema>
EOF

cat > shared/schemas/database/index.ts << 'EOF'
// Database Schemas
// This will be expanded when we set up Prisma
export {}
EOF

cat > shared/schemas/events/index.ts << 'EOF'
// Event Schemas
// This will be expanded for real-time events
export {}
EOF

# ===================================================================
# STEP 2: CREATE CLIENT BASIC FILES
# ===================================================================

echo "⚛️ Setting up client basic files..."

# Update client types
cat > client/src/types/index.ts << 'EOF'
// Client Types
export * from './api'
export * from './park'
export * from './user'
export * from './trip'

// Re-export shared types
export * from '@trailverse/shared'
EOF

cat > client/src/types/api.ts << 'EOF'
// Client-specific API types
import type { ApiResponse, PaginatedResponse } from '@trailverse/shared'

export interface ApiClient {
  get<T>(url: string): Promise<ApiResponse<T>>
  post<T>(url: string, data?: any): Promise<ApiResponse<T>>
  put<T>(url: string, data?: any): Promise<ApiResponse<T>>
  delete<T>(url: string): Promise<ApiResponse<T>>
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SearchParams extends PaginationParams {
  search?: string
  state?: string
  activity?: string
  sortBy?: 'name' | 'popularity' | 'rating'
  sortOrder?: 'asc' | 'desc'
}
EOF

cat > client/src/types/park.ts << 'EOF'
// Park-specific client types
import type { Park } from '@trailverse/shared'

export interface ParkWithDistance extends Park {
  distance?: number
}

export interface ParkSearchResult {
  parks: ParkWithDistance[]
  total: number
  hasMore: boolean
}

export interface ParkFilters {
  states: string[]
  activities: string[]
  crowdLevels: Array<'low' | 'medium' | 'high' | 'very-high'>
  rating?: number
}
EOF

cat > client/src/types/user.ts << 'EOF'
// User-specific client types
import type { User, UserPreferences } from '@trailverse/shared'

export interface AuthUser extends User {
  isAuthenticated: boolean
}

export interface UserProfile extends User {
  stats: {
    parksVisited: number
    reviewsWritten: number
    tripsPlanned: number
  }
}

export interface UpdateProfileRequest {
  name?: string
  preferences?: Partial<UserPreferences>
}
EOF

cat > client/src/types/trip.ts << 'EOF'
// Trip-specific client types
import type { Trip, Park } from '@trailverse/shared'

export interface TripWithParks extends Trip {
  parks: Park[]
  estimatedDistance: number
  estimatedDuration: number
}

export interface TripPlanningData {
  selectedParks: Park[]
  route: {
    coordinates: Array<[number, number]>
    distance: number
    duration: number
  }
  accommodation: any[]
  restaurants: any[]
}
EOF

# Create client config
cat > client/src/config/index.ts << 'EOF'
// Client Configuration

export const APP_CONFIG = {
  name: 'Trailverse',
  version: '1.0.0',
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 10000,
  },
  maps: {
    googleApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  },
  features: {
    enableAR: import.meta.env.VITE_ENABLE_AR_FEATURES === 'true',
    enableVoice: import.meta.env.VITE_ENABLE_VOICE_FEATURES === 'true',
    enableAI: import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS === 'true',
  },
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

export default APP_CONFIG
EOF

# ===================================================================
# STEP 3: CREATE SERVER BASIC FILES
# ===================================================================

echo "🚀 Setting up server basic files..."

# Update server types
cat > server/src/types/index.ts << 'EOF'
// Server Types
export * from './api'
export * from './auth'
export * from './models'

// Re-export shared types
export * from '@trailverse/shared'
EOF

cat > server/src/types/api.ts << 'EOF'
// Server API types
import type { Request, Response } from 'express'
import type { User } from '@trailverse/shared'

export interface AuthenticatedRequest extends Request {
  user: User
}

export interface ApiController {
  [key: string]: (req: Request, res: Response) => Promise<void>
}

export interface PaginationQuery {
  page?: string
  limit?: string
}

export interface SearchQuery extends PaginationQuery {
  search?: string
  state?: string
  activity?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
EOF

cat > server/src/types/auth.ts << 'EOF'
// Authentication types
export interface JwtPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface PasswordResetToken {
  token: string
  userId: string
  expiresAt: Date
}
EOF

cat > server/src/types/models.ts << 'EOF'
// Database model types
// These will be generated by Prisma, but we can define additional types here

export interface DatabaseUser {
  id: string
  email: string
  name: string
  passwordHash: string
  avatar?: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  name: string
  passwordHash: string
}

export interface UpdateUserData {
  name?: string
  avatar?: string
  emailVerified?: boolean
}
EOF

# Create server config
cat > server/src/config/index.ts << 'EOF'
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
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
]

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
)

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingEnvVars.forEach((envVar) => {
    console.error(`   - ${envVar}`)
  })
  process.exit(1)
}
EOF

# ===================================================================
# STEP 4: FIX PACKAGE.JSON SCRIPTS
# ===================================================================

echo "📦 Fixing package.json scripts..."

# Update client package.json to fix the script format issue
cat > client/package.json << 'EOF'
{
  "name": "trailverse-client",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,css,md,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,css,md,json}\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "clean": "rm -rf dist node_modules/.vite",
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.1",
    "@tanstack/react-query": "^5.17.9",
    "@tanstack/react-query-devtools": "^5.17.9",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "axios": "^1.6.2",
    "react-map-gl": "^7.1.7",
    "mapbox-gl": "^3.0.1",
    "framer-motion": "^10.16.16",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "lucide-react": "^0.294.0",
    "recharts": "^2.8.0",
    "date-fns": "^3.0.6",
    "react-hot-toast": "^2.4.1",
    "react-intersection-observer": "^9.5.3",
    "@tensorflow/tfjs": "^4.15.0",
    "three": "^0.159.0",
    "@react-three/fiber": "^8.15.12",
    "@react-three/drei": "^9.88.13"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/three": "^0.159.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-testing-library": "^6.2.0",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@tailwindcss/aspect-ratio": "^0.4.2",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "vitest": "^1.0.4",
    "jsdom": "^23.0.1",
    "@vitest/ui": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Update server package.json
cat > server/package.json << 'EOF'
{
  "name": "trailverse-server",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "nodemon",
    "dev:debug": "nodemon --inspect",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "start": "node dist/app.js",
    "start:prod": "NODE_ENV=production node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "lint": "eslint src --ext .ts --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:reset": "prisma migrate reset",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seeds/index.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset && npm run db:seed",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "prisma": "^5.7.1",
    "@prisma/client": "^5.7.1",
    "redis": "^4.6.11",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "nodemailer": "^6.9.7",
    "bull": "^4.12.2",
    "socket.io": "^4.7.4",
    "ws": "^8.16.0",
    "axios": "^1.6.2",
    "node-cron": "^3.0.3",
    "winston": "^3.11.0",
    "express-winston": "^4.2.0",
    "@tensorflow/tfjs-node": "^4.15.0",
    "natural": "^6.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/ws": "^8.5.10",
    "typescript": "^5.3.3",
    "tsx": "^4.6.2",
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-security": "^1.7.1",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-jest": "^27.6.0",
    "prettier": "^3.1.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16"
  }
}
EOF

# ===================================================================
# STEP 5: ADD ROOT SCRIPTS FOR EASY MANAGEMENT
# ===================================================================

echo "🛠️ Adding root management scripts..."

# Update root package.json with comprehensive scripts
cat > package.json << 'EOF'
{
  "name": "trailverse",
  "version": "1.0.0",
  "description": "🔥 Trailverse - Your Universe of Trail Adventures. Advanced National Parks Explorer with AI, AR, and Real-time Features",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "build:shared": "cd shared && npm run build",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "test": "npm run test:shared && npm run test:client && npm run test:server",
    "test:shared": "cd shared && npm run test",
    "test:client": "cd client && npm run test:run",
    "test:server": "cd server && npm run test",
    "test:coverage": "npm run test:shared && npm run test:client -- --coverage && npm run test:server -- --coverage",
    "lint": "npm run lint:shared && npm run lint:client && npm run lint:server",
    "lint:shared": "cd shared && npm run lint",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    "lint:fix": "npm run lint:shared -- --fix && npm run lint:client -- --fix && npm run lint:server -- --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "npm run type-check:shared && npm run type-check:client && npm run type-check:server",
    "type-check:shared": "cd shared && npm run build",
    "type-check:client": "cd client && npm run type-check",
    "type-check:server": "cd server && npm run type-check",
    "setup": "npm install",
    "setup:workspaces": "npm run setup:shared && npm run setup:client && npm run setup:server",
    "setup:shared": "cd shared && npm install",
    "setup:client": "cd client && npm install",
    "setup:server": "cd server && npm install",
    "setup:mobile": "cd mobile && npm install",
    "docker:dev": "docker-compose -f docker-compose.yml up",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "clean": "npm run clean:deps && npm run clean:builds",
    "clean:deps": "rm -rf node_modules client/node_modules server/node_modules shared/node_modules mobile/node_modules",
    "clean:builds": "rm -rf client/dist server/dist shared/dist",
    "reset": "npm run clean && npm run setup && npm run setup:workspaces",
    "verify": "./verify-setup.sh"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/trailversedev/trailverse.git"
  },
  "keywords": [
    "trailverse",
    "national-parks",
    "travel",
    "outdoor",
    "trails",
    "hiking",
    "react",
    "nodejs",
    "ai",
    "machine-learning",
    "ar",
    "augmented-reality",
    "real-time",
    "pwa",
    "mobile-app",
    "adventure",
    "nature",
    "exploration"
  ],
  "author": "Trailverse Team <dev@trailverse.app>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/trailversedev/trailverse/issues"
  },
  "homepage": "https://trailverse.app",
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "volta": {
    "node": "18.19.0",
    "npm": "10.2.3"
  }
}
EOF

# ===================================================================
# STEP 6: CREATE ENVIRONMENT SETUP SCRIPT
# ===================================================================

echo "⚙️ Creating environment setup script..."

cat > setup-env.sh << 'EOF'
#!/bin/bash

echo "⚙️ Setting up Trailverse environment files..."

# Create root .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created root .env file"
else
  echo "ℹ️  Root .env file already exists"
fi

# Create client .env
if [ ! -f client/.env ]; then
  cp client/.env.example client/.env
  echo "✅ Created client .env file"
else
  echo "ℹ️  Client .env file already exists"
fi

# Create server .env
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "✅ Created server .env file"
else
  echo "ℹ️  Server .env file already exists"
fi

# Create server .env.test
cat > server/.env.test << 'ENVEOF'
NODE_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/trailverse_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret-for-testing-only
SUPPRESS_TEST_LOGS=true
ENVEOF

echo "✅ Created server test environment file"

echo ""
echo "🎯 Environment files created! Remember to:"
echo "1. Add your actual API keys to the .env files"
echo "2. Update database URLs if using different credentials"
echo "3. Keep .env files secure and never commit them to git"
EOF

chmod +x setup-env.sh

# ===================================================================
# STEP 7: CREATE QUICK START SCRIPT
# ===================================================================

echo "🚀 Creating quick start script..."

cat > quick-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Trailverse Quick Start"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm run setup:workspaces

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Setup environment files
echo ""
echo "⚙️ Step 2: Setting up environment files..."
./setup-env.sh

# Step 3: Type checking
echo ""
echo "🔍 Step 3: Running type checks..."
npm run type-check

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All TypeScript checks passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some TypeScript issues found, but continuing...${NC}"
fi

# Step 4: Linting
echo ""
echo "🧹 Step 4: Running linting..."
npm run lint

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All linting checks passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some linting issues found. Run 'npm run lint:fix' to fix automatically.${NC}"
fi

# Step 5: Format code
echo ""
echo "💅 Step 5: Formatting code..."
npm run format

echo -e "${GREEN}✅ Code formatted successfully${NC}"

# Step 6: Run tests
echo ""
echo "🧪 Step 6: Running tests..."
npm run test

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed or need to be written${NC}"
fi

echo ""
echo "🎉 TRAILVERSE SETUP COMPLETE!"
echo "=============================="
echo ""
echo -e "${GREEN}🚀 Ready to start development:${NC}"
echo ""
echo "1. Start databases:"
echo "   docker-compose up -d"
echo ""
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo ""
echo -e "${GREEN}Happy coding! 🏔️${NC}"
EOF

chmod +x quick-start.sh

echo ""
echo "✅ TYPESCRIPT SETUP FIXED!"
echo "=========================="
echo ""
echo "📁 Created comprehensive TypeScript structure:"
echo "├── 🔗 Shared package with types, constants, utils, schemas"
echo "├── ⚛️  Client types and configuration"
echo "├── 🚀 Server types and configuration"
echo "├── 📦 Fixed all package.json files"
echo "├── ⚙️  Environment setup script"
echo "└── 🚀 Quick start automation script"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "Option 1 - Quick Start (Recommended):"
echo "   ./quick-start.sh"
echo ""
echo "Option 2 - Manual Setup:"
echo "   1. npm run setup:workspaces"
echo "   2. ./setup-env.sh"
echo "   3. npm run type-check"
echo "   4. npm run lint"
echo "   5. npm run format"
echo ""
echo "Option 3 - Verify Only:"
echo "   ./verify-setup.sh"
echo ""
echo "🔥 The TypeScript issues should now be resolved!"
echo "All workspaces have proper type definitions and configurations."
