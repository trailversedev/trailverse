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
