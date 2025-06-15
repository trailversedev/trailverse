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
