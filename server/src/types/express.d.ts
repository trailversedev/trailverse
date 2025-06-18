// server/src/types/express.d.ts
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isVerified: boolean;
        isActive: boolean;
      };
      sessionId?: string;
      csrfToken?: string;
      rateLimitInfo?: {
        remaining: number;
        resetTime: number;
      };
    }
  }
}

export {};
