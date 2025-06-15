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
