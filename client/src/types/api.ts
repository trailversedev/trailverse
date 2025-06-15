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
