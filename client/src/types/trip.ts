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
