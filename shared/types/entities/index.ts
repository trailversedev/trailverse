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
