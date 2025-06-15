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
