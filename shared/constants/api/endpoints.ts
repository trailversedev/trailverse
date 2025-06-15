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
