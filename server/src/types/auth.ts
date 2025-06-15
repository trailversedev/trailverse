// Authentication types
export interface JwtPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface PasswordResetToken {
  token: string
  userId: string
  expiresAt: Date
}
