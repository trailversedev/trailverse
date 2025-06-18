// server/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from './errorHandler';
import { authService } from '../services/authService';

// Common validation schemas
export const schemas = {
  // Email validation
  email: z.string().email('Invalid email format').min(1, 'Email is required'),

  // Password validation (integrates with authService)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => {
      const { isValid, feedback } = authService.validatePasswordStrength(password);
      if (!isValid) {
        throw new Error(feedback.join(', '));
      }
      return true;
    }, 'Password does not meet security requirements'),

  // User registration
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  // User login
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),

  // Password reset request
  passwordResetRequest: z.object({
    email: z.string().email('Invalid email format'),
  }),

  // Password reset
  passwordReset: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  // Profile update
  profileUpdate: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
    email: z.string().email('Invalid email format').optional(),
    bio: z.string().max(500, 'Bio too long').optional(),
    preferences: z.object({
      notifications: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
    }).optional(),
  }),

  // Change password
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  // Park search/filter
  parkSearch: z.object({
    search: z.string().optional(),
    state: z.string().optional(),
    activities: z.array(z.string()).optional(),
    crowdLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
    sortBy: z.enum(['name', 'popularity', 'distance', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Review creation
  reviewCreate: z.object({
    parkId: z.string().uuid('Invalid park ID'),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
    content: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review too long'),
    visitDate: z.string().datetime('Invalid visit date').optional(),
    images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images').optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    file: z.object({
      mimetype: z.string().refine(
        (type) => ['image/jpeg', 'image/png', 'image/webp'].includes(type),
        'Only JPEG, PNG, and WebP images are allowed'
      ),
      size: z.number().max(5 * 1024 * 1024, 'File size cannot exceed 5MB'),
    }),
  }),

  // Admin user creation
  adminUserCreate: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['USER', 'PREMIUM', 'RANGER', 'ADMIN']),
    isActive: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(true),
  }),

  // Pagination
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

/**
 * Validation middleware factory
 */
export const validate = (schema: ZodSchema<any>, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let dataToValidate;

      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      // Validate the data
      const validatedData = schema.parse(dataToValidate);

      // Replace the original data with validated data
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          {
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              received: err.received,
            }))
          }
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Rate limiting validation for specific endpoints
 */
export const validateRateLimit = (identifier: 'email' | 'ip' = 'ip') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let rateLimitKey: string;

      if (identifier === 'email' && req.body.email) {
        rateLimitKey = req.body.email;

        // Special handling for password reset requests
        if (req.path.includes('password-reset')) {
          const result = await authService.checkPasswordResetAttempts(rateLimitKey);
          if (!result.allowed) {
            throw new ValidationError(
              `Too many password reset attempts. Try again in ${Math.ceil((result.resetTime! - Date.now()) / 1000 / 60)} minutes.`,
              { remainingAttempts: result.remainingAttempts, resetTime: result.resetTime }
            );
          }
        }
      } else {
        rateLimitKey = req.ip || 'unknown';
      }

      // Check login attempts for login endpoint
      if (req.path.includes('login')) {
        const result = await authService.checkLoginAttempts(rateLimitKey);
        if (!result.allowed) {
          throw new ValidationError(
            `Too many login attempts. Try again in ${Math.ceil((result.resetTime! - Date.now()) / 1000 / 60)} minutes.`,
            { remainingAttempts: result.remainingAttempts, resetTime: result.resetTime }
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Password strength validation middleware
 */
export const validatePasswordStrength = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const password = req.body.password || req.body.newPassword;

    if (!password) {
      next();
      return;
    }

    const validation = authService.validatePasswordStrength(password);

    if (!validation.isValid) {
      throw new ValidationError(
        'Password does not meet security requirements',
        {
          score: validation.score,
          feedback: validation.feedback,
          requirements: [
            'At least 8 characters long',
            'Contains uppercase letters',
            'Contains lowercase letters',
            'Contains numbers',
            'Contains special characters',
            'Avoids common patterns'
          ]
        }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
} = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 5
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;

      // Check single file
      if (file) {
        if (!allowedTypes.includes(file.mimetype)) {
          throw new ValidationError(
            `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
          );
        }

        if (file.size > maxSize) {
          throw new ValidationError(
            `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum ${Math.round(maxSize / 1024 / 1024)}MB`
          );
        }
      }

      // Check multiple files
      if (files && Array.isArray(files)) {
        if (files.length > maxFiles) {
          throw new ValidationError(`Maximum ${maxFiles} files allowed`);
        }

        for (const uploadedFile of files) {
          if (!allowedTypes.includes(uploadedFile.mimetype)) {
            throw new ValidationError(
              `File type ${uploadedFile.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
            );
          }

          if (uploadedFile.size > maxSize) {
            throw new ValidationError(
              `File ${uploadedFile.originalname} size exceeds maximum ${Math.round(maxSize / 1024 / 1024)}MB`
            );
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Basic HTML/script tag removal
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize body, query, and params
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// Export commonly used validation combinations
export const authValidation = {
  register: [
    sanitizeInput,
    validateRateLimit('email'),
    validate(schemas.register),
    validatePasswordStrength
  ],
  login: [
    sanitizeInput,
    validateRateLimit('email'),
    validate(schemas.login)
  ],
  passwordResetRequest: [
    sanitizeInput,
    validateRateLimit('email'),
    validate(schemas.passwordResetRequest)
  ],
  passwordReset: [
    sanitizeInput,
    validate(schemas.passwordReset),
    validatePasswordStrength
  ],
  changePassword: [
    sanitizeInput,
    validate(schemas.changePassword),
    validatePasswordStrength
  ]
};

export const parkValidation = {
  search: [
    sanitizeInput,
    validate(schemas.parkSearch, 'query')
  ],
  createReview: [
    sanitizeInput,
    validate(schemas.reviewCreate)
  ]
};

export const commonValidation = {
  idParam: validate(schemas.idParam, 'params'),
  pagination: validate(schemas.pagination, 'query'),
  fileUpload: validateFileUpload()
};

export default {
  validate,
  validateRateLimit,
  validatePasswordStrength,
  validateFileUpload,
  sanitizeInput,
  schemas,
  authValidation,
  parkValidation,
  commonValidation
};
