/**

 - 🏞️ Parks API Functions
 -
 - API functions for national parks data:
 - - Search and filtering
 - - Park details and information
 - - Weather and conditions
 - - Reviews and ratings
 - - Favorites and bookmarks
 - - Trail information
 -
 - @author Krishna Sathvik
 - @version 1.0.0
 */

import apiClient, { ApiResponse, RequestConfig } from ‘./client’;

// ===============================
// 🔧 TYPES & INTERFACES
// ===============================

export interface Park {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  state: string;
  region: string;
  established: string;
  area: number; // in acres
  visitors: number; // annual visitors

// Location
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

// Media
  images: ParkImage[];
  videos?: ParkVideo[];
  virtualTours?: VirtualTour[];

// Features
  features: string[];
  activities: Activity[];
  accessibility: AccessibilityInfo;
  fees: FeeInfo[];

// Conditions
  currentConditions?: ParkConditions;
  weatherInfo?: WeatherInfo;
  crowdLevel?: CrowdLevel;

// Stats
  rating: number;
  reviewCount: number;
  favoriteCount: number;

// Metadata
  isOpen: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParkImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  photographer?: string;
  isPrimary: boolean;
  category: ‘landscape’ | ‘wildlife’ | ‘activity’ | ‘facility’ | ‘other’;
}

export interface ParkVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  duration: number;
  category: ‘overview’ | ‘activity’ | ‘wildlife’ | ‘drone’ | ‘other’;
}

export interface VirtualTour {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
  type: ‘360’ | ‘vr’ | ‘interactive’;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  difficulty: ‘easy’ | ‘moderate’ | ‘difficult’ | ‘expert’;
  duration?: string;
  description?: string;
  requirements?: string[];
  seasonality?: string;
  isPopular: boolean;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  visuallyImpairedAccess: boolean;
  hearingImpairedAccess: boolean;
  accessibleTrails: string[];
  accessibleFacilities: string[];
  description?: string;
}

export interface FeeInfo {
  type: ‘entrance’ | ‘camping’ | ‘parking’ | ‘activity’;
  amount: number;
  description: string;
  duration?: string;
  validFrom?: string;
  validTo?: string;
}

export interface ParkConditions {
  status: ‘open’ | ‘closed’ | ‘limited’;
  alerts: Alert[];
  roadConditions: RoadCondition[];
  trailConditions: TrailCondition[];
  lastUpdated: string;
}

export interface Alert {
  id: string;
  type: ‘warning’ | ‘closure’ | ‘info’ | ‘emergency’;
  title: string;
  description: string;
  severity: ‘low’ | ‘medium’ | ‘high’ | ‘critical’;
  startDate: string;
  endDate?: string;
  affectedAreas: string[];
}

export interface RoadCondition {
  name: string;
  status: ‘open’ | ‘closed’ | ‘limited’;
  description?: string;
  lastUpdated: string;
}

export interface TrailCondition {
  name: string;
  status: ‘open’ | ‘closed’ | ‘limited’;
  difficulty: ‘easy’ | ‘moderate’ | ‘difficult’ | ‘expert’;
  length: number; // in miles
  description?: string;
  lastUpdated: string;
}

export interface WeatherInfo {
  current: CurrentWeather;
  forecast: WeatherForecast[];
  lastUpdated: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  uvIndex: number;
  condition: string;
  icon: string;
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
}

export interface CrowdLevel {
  current: ‘low’ | ‘moderate’ | ‘high’ | ‘very-high’;
  prediction: CrowdPrediction[];
  factors: string[];
  lastUpdated: string;
}

export interface CrowdPrediction {
  date: string;
  timeSlot: string;
  level: ‘low’ | ‘moderate’ | ‘high’ | ‘very-high’;
  confidence: number;
}

export interface ParkSearchParams {
  query?: string;
  state?: string;
  region?: string;
  activities?: string[];
  features?: string[];
  difficulty?: string[];
  minRating?: number;
  maxDistance?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  sortBy?: ‘name’ | ‘rating’ | ‘popularity’ | ‘distance’ | ‘established’;
  sortOrder?: ‘asc’ | ‘desc’;
  page?: number;
  limit?: number;
  includeClosed?: boolean;
  premiumOnly?: boolean;
}

export interface ParkSearchResponse {
  parks: Park[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    states: Array<{ value: string; label: string; count: number }>;
    regions: Array<{ value: string; label: string; count: number }>;
    activities: Array<{ value: string; label: string; count: number }>;
    features: Array<{ value: string; label: string; count: number }>;
  };
}

export interface ParkReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  visitDate: string;
  helpful: number;
  isVerified: boolean;
  isRecommended: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParkStats {
  totalParks: number;
  totalVisitors: number;
  averageRating: number;
  mostPopular: Park[];
  recentlyAdded: Park[];
  trending: Park[];
}

// ===============================
// 🏞️ PARKS API FUNCTIONS
// ===============================

/**

 - Search and filter parks
 */
export const searchParks = async (
  params?: ParkSearchParams,
  config?: RequestConfig
): Promise<ParkSearchResponse> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (typeof value === ‘object’ && key === ‘coordinates’) {
          queryParams.append(‘lat’, value.latitude.toString());
          queryParams.append(‘lng’, value.longitude.toString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const response = await apiClient.get<ParkSearchResponse>(
    `/api/parks?${queryParams.toString()}`,
    config
  );

  return response.data!;
};

/**

 - Get park by ID or slug
 */
export const getPark = async (
  identifier: string,
  config?: RequestConfig
): Promise<Park> => {
  const response = await apiClient.get<Park>(
    `/api/parks/${identifier}`,
    config
  );

  return response.data!;
};

/**

 - Get park details with related information
 */
export const getParkDetails = async (
  identifier: string,
  include?: string[],
  config?: RequestConfig
): Promise<Park & {
  reviews?: ParkReview[];
  nearbyParks?: Park[];
  similarParks?: Park[];
}> => {
  const queryParams = new URLSearchParams();

  if (include) {
    queryParams.append(‘include’, include.join(’,’));
  }

  const response = await apiClient.get<Park>(
    `/api/parks/${identifier}/details?${queryParams.toString()}`,
    config
  );

  return response.data!;
};

/**

 - Get featured parks
 */
export const getFeaturedParks = async (
  limit: number = 10,
  config?: RequestConfig
): Promise<Park[]> => {
  const response = await apiClient.get<Park[]>(
    `/api/parks/featured?limit=${limit}`,
    config
  );

  return response.data!;
};

/**

 - Get popular parks
 */
export const getPopularParks = async (
  limit: number = 10,
  timeframe: ‘week’ | ‘month’ | ‘year’ = ‘month’,
config?: RequestConfig
): Promise<Park[]> => {
  const response = await apiClient.get<Park[]>(
    `/api/parks/popular?limit=${limit}&timeframe=${timeframe}`,
    config
  );

  return response.data!;
};

/**

 - Get nearby parks
 */
export const getNearbyParks = async (
  latitude: number,
  longitude: number,
  radius: number = 100, // miles
  limit: number = 10,
  config?: RequestConfig
): Promise<Park[]> => {
  const response = await apiClient.get<Park[]>(
    `/api/parks/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}&limit=${limit}`,
    config
  );

  return response.data!;
};

/**

 - Get park conditions and alerts
 */
export const getParkConditions = async (
  parkId: string,
  config?: RequestConfig
): Promise<ParkConditions> => {
  const response = await apiClient.get<ParkConditions>(
    `/api/parks/${parkId}/conditions`,
    config
  );

  return response.data!;
};

/**

 - Get park weather information
 */
export const getParkWeather = async (
  parkId: string,
  days: number = 7,
  config?: RequestConfig
): Promise<WeatherInfo> => {
  const response = await apiClient.get<WeatherInfo>(
    `/api/parks/${parkId}/weather?days=${days}`,
    config
  );

  return response.data!;
};

/**

 - Get park crowd levels
 */
export const getParkCrowds = async (
  parkId: string,
  days: number = 7,
  config?: RequestConfig
): Promise<CrowdLevel> => {
  const response = await apiClient.get<CrowdLevel>(
    `/api/parks/${parkId}/crowds?days=${days}`,
    config
  );

  return response.data!;
};

/**

 - Get park reviews
 */
export const getParkReviews = async (
  parkId: string,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: ‘newest’ | ‘oldest’ | ‘rating’ | ‘helpful’;
    rating?: number;
  },
  config?: RequestConfig
): Promise<{
  reviews: ParkReview[];
  total: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await apiClient.get(
    `/api/parks/${parkId}/reviews?${queryParams.toString()}`,
    config
  );

  return response.data!;
};

/**

 - Add park to favorites
 */
export const addToFavorites = async (
  parkId: string,
  config?: RequestConfig
): Promise<boolean> => {
  const response = await apiClient.post(
    `/api/parks/${parkId}/favorite`,
    {},
    config
  );

  return response.success;
};

/**

 - Remove park from favorites
 */
export const removeFromFavorites = async (
  parkId: string,
  config?: RequestConfig
): Promise<boolean> => {
  const response = await apiClient.delete(
    `/api/parks/${parkId}/favorite`,
    config
  );

  return response.success;
};

/**

 - Get user’s favorite parks
 */
export const getFavoriteParks = async (
  params?: {
    page?: number;
    limit?: number;
    sortBy?: ‘added’ | ‘name’ | ‘rating’;
  },
  config?: RequestConfig
): Promise<{
  parks: Park[];
  total: number;
}> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await apiClient.get(
    `/api/parks/favorites?${queryParams.toString()}`,
    config
  );

  return response.data!;
};

/**

 - Submit park review
 */
export const submitReview = async (
  parkId: string,
  reviewData: {
    rating: number;
    title: string;
    content: string;
    visitDate: string;
    isRecommended: boolean;
    images?: File[];
    tags?: string[];
  },
  config?: RequestConfig
): Promise<ParkReview> => {
  const formData = new FormData();

  formData.append(‘rating’, reviewData.rating.toString());
  formData.append(‘title’, reviewData.title);
  formData.append(‘content’, reviewData.content);
  formData.append(‘visitDate’, reviewData.visitDate);
  formData.append(‘isRecommended’, reviewData.isRecommended.toString());

  if (reviewData.tags) {
    formData.append(‘tags’, JSON.stringify(reviewData.tags));
  }

  if (reviewData.images) {
    reviewData.images.forEach((image, index) => {
      formData.append(`images`, image);
    });
  }

  const response = await apiClient.post(
    `/api/parks/${parkId}/reviews`,
    formData,
    {
…config,
    headers: {
  …config?.headers,
‘Content-Type’: ‘multipart/form-data’,
  },
}
);

  return response.data!;
};

/**

 - Get park statistics
 */
export const getParkStats = async (
  config?: RequestConfig
): Promise<ParkStats> => {
  const response = await apiClient.get<ParkStats>(
  ‘/api/parks/stats’,
  { …config, skipAuth: true }
);

  return response.data!;
};

/**

 - Get park suggestions based on user preferences
 */
export const getParkSuggestions = async (
  params?: {
    location?: { latitude: number; longitude: number };
    preferences?: string[];
    limit?: number;
  },
  config?: RequestConfig
): Promise<Park[]> => {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.location) {
      queryParams.append(‘lat’, params.location.latitude.toString());
      queryParams.append(‘lng’, params.location.longitude.toString());
    }
    if (params.preferences) {
      queryParams.append(‘preferences’, params.preferences.join(’,’));
    }
    if (params.limit) {
      queryParams.append(‘limit’, params.limit.toString());
    }
  }

  const response = await apiClient.get<Park[]>(
    `/api/parks/suggestions?${queryParams.toString()}`,
    config
  );

  return response.data!;
};

// ===============================
// 🚀 EXPORT ALL FUNCTIONS
// ===============================

export default {
  searchParks,
  getPark,
  getParkDetails,
  getFeaturedParks,
  getPopularParks,
  getNearbyParks,
  getParkConditions,
  getParkWeather,
  getParkCrowds,
  getParkReviews,
  addToFavorites,
  removeFromFavorites,
  getFavoriteParks,
  submitReview,
  getParkStats,
  getParkSuggestions,
};
