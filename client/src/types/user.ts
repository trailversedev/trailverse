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
