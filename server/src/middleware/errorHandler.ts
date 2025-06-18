import { Request, Response, NextFunction } from ‘express’;
import { Prisma } from ‘@prisma/client’;
import { ZodError } from ‘zod’;
import { MulterError } from ‘multer’;
import { JsonWebTokenError, TokenExpiredError } from ‘jsonwebtoken’;
import config from ‘../config/environment’;

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ‘INTERNAL_ERROR’,
  isOperational: boolean = true,
  details?: any
) {
  super(message);
  this.statusCode = statusCode;
  this.code = code;
  this.isOperational = isOperational;
  this.details = details;

```
Error.captureStackTrace(this, this.constructor);
```

}
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ‘VALIDATION_ERROR’, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = ‘Authentication required’) {
  super(message, 401, ‘AUTHENTICATION_ERROR’, true);
}
}

export class AuthorizationError extends AppError {
  constructor(message: string = ‘Insufficient permissions’) {
  super(message, 403, ‘AUTHORIZATION_ERROR’, true);
}
}

export class NotFoundError extends AppError {
  constructor(resource: string = ‘Resource’) {
  super(`${resource} not found`, 404, ‘NOT_FOUND’, true);
}
}

export class ConflictError extends AppError {
constructor(message: string) {
super(message, 409, ‘CONFLICT_ERROR’, true);
}
}

export class RateLimitError extends AppError {
constructor(message: string = ‘Rate limit exceeded’) {
super(message, 429, ‘RATE_LIMIT_ERROR’, true);
}
}

export class ServiceUnavailableError extends AppError {
constructor(service: string = ‘Service’) {
super(`${service} is currently unavailable`, 503, ‘SERVICE_UNAVAILABLE’, true);
}
}

// Error response interface
interface ErrorResponse {
success: false;
error: string;
code: string;
statusCode: number;
timestamp: string;
path: string;
method: string;
requestId?: string;
details?: any;
stack?: string;
suggestion?: string;
documentation?: string;
}

// Error logging utility
class ErrorLogger {
static log(error: Error, req: Request, additionalInfo?: any): void {
const logData = {
message: error.message,
stack: error.stack,
url: req.originalUrl,
method: req.method,
ip: req.ip,
userAgent: req.get(‘User-Agent’),
userId: (req as any).user?.id,
sessionId: (req as any).sessionId,
timestamp: new Date().toISOString(),
…additionalInfo,
};

```
if (config.isDevelopment) {
  console.error('🚨 Error Details:', logData);
} else {
  // In production, log to external service (e.g., Sentry, CloudWatch)
  console.error(JSON.stringify(logData));

  // TODO: Send to external logging service
  // await sendToSentry(error, logData);
  // await sendToDatadog(logData);
}
```

}

static logWarning(message: string, req: Request, additionalInfo?: any): void {
const logData = {
level: ‘warning’,
message,
url: req.originalUrl,
method: req.method,
userId: (req as any).user?.id,
timestamp: new Date().toISOString(),
…additionalInfo,
};

```
console.warn('⚠️ Warning:', logData);
```

}
}

// Error classification and handling
class ErrorHandler {
  /**

   - Convert different error types to standardized AppError
   */
static classifyError(error: any): AppError {
  // Already an AppError
if (error instanceof AppError) {
return error;
}

```
// Prisma errors
if (error instanceof Prisma.PrismaClientKnownRequestError) {
  return this.handlePrismaKnownError(error);
}

if (error instanceof Prisma.PrismaClientUnknownRequestError) {
  return new AppError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    true,
    { originalError: error.message }
  );
}

if (error instanceof Prisma.PrismaClientValidationError) {
  return new ValidationError(
    'Invalid data provided',
    { originalError: error.message }
  );
}

// Zod validation errors
if (error instanceof ZodError) {
  return this.handleZodError(error);
}

// JWT errors
if (error instanceof JsonWebTokenError) {
  return new AuthenticationError('Invalid token');
}

if (error instanceof TokenExpiredError) {
  return new AuthenticationError('Token expired');
}

// Multer file upload errors
if (error instanceof MulterError) {
  return this.handleMulterError(error);
}

// MongoDB errors (if using MongoDB)
if (error.name === 'MongoError' || error.name === 'MongooseError') {
  return this.handleMongoError(error);
}

// Network/HTTP errors
if (error.code === 'ECONNREFUSED') {
  return new ServiceUnavailableError('External service');
}

if (error.code === 'ETIMEDOUT') {
  return new AppError(
    'Request timeout',
    408,
    'REQUEST_TIMEOUT',
    true
  );
}

// Default to internal server error
return new AppError(
  config.isDevelopment ? error.message : 'Internal server error',
  500,
  'INTERNAL_ERROR',
  false,
  config.isDevelopment ? { stack: error.stack } : undefined
);
```

}

  /**

   - Handle Prisma known request errors
   */
private static handlePrismaKnownError(error: Prisma.PrismaClientKnownRequestError): AppError {
switch (error.code) {
case ‘P2002’: // Unique constraint violation
const target = error.meta?.target as string[];
const field = target?.[0] || ‘field’;
return new ConflictError(`A record with this ${field} already exists`);

case ‘P2025’: // Record not found
return new NotFoundError(‘Record’);

case ‘P2003’: // Foreign key constraint violation
return new ValidationError(‘Referenced record does not exist’);

case ‘P2014’: // Relation violation
return new ValidationError(‘Invalid relation data provided’);

case ‘P2021’: // Table does not exist
return new AppError(
‘Database schema error’,
500,
‘SCHEMA_ERROR’,
false
);

case ‘P2024’: // Connection timeout
return new ServiceUnavailableError(‘Database’);

default:
return new AppError(
‘Database operation failed’,
500,
‘DATABASE_ERROR’,
true,
{ code: error.code, meta: error.meta }
);
}
}

  /**

   - Handle Zod validation errors
   */
private static handleZodError(error: ZodError): ValidationError {
const details = error.errors.map(err => ({
field: err.path.join(’.’),
message: err.message,
code: err.code,
received: err.received,
}));

```
return new ValidationError(
  'Validation failed',
  { errors: details }
);
```

}

  /**

   - Handle Multer file upload errors
   */
private static handleMulterError(error: MulterError): AppError {
switch (error.code) {
case ‘LIMIT_FILE_SIZE’:
return new ValidationError(‘File size too large’);

case ‘LIMIT_FILE_COUNT’:
return new ValidationError(‘Too many files uploaded’);

case ‘LIMIT_UNEXPECTED_FILE’:
return new ValidationError(‘Unexpected file field’);

default:
return new ValidationError(`File upload error: ${error.message}`);
}
}

  /**

   - Handle MongoDB errors
   */
private static handleMongoError(error: any): AppError {
if (error.code === 11000) {
  // Duplicate key error
const field = Object.keys(error.keyPattern || {})[0] || ‘field’;
return new ConflictError(`A record with this ${field} already exists`);
}

```
return new AppError(
  'Database operation failed',
  500,
  'DATABASE_ERROR',
  true,
  { originalError: error.message }
);
```

}

  /**

   - Get user-friendly error suggestions
   */
static getErrorSuggestion(error: AppError): string | undefined {
switch (error.code) {
case ‘AUTHENTICATION_ERROR’:
return ‘Please log in to access this resource’;

case ‘AUTHORIZATION_ERROR’:
return ‘Contact an administrator if you believe you should have access’;

case ‘VALIDATION_ERROR’:
return ‘Please check your input and try again’;

case ‘NOT_FOUND’:
return ‘Please verify the resource ID or URL’;

case ‘RATE_LIMIT_ERROR’:
return ‘Please wait a moment before trying again’;

case ‘SERVICE_UNAVAILABLE’:
return ‘Please try again later or contact support if the issue persists’;

default:
return undefined;
}
}

  /**

   - Get documentation links for common errors
   */
static getDocumentationLink(error: AppError): string | undefined {
const baseUrl = ‘https://docs.trailverse.com’;

```
switch (error.code) {
  case 'AUTHENTICATION_ERROR':
    return `${baseUrl}/authentication`;

case 'AUTHORIZATION_ERROR':
return `${baseUrl}/permissions`;

case 'VALIDATION_ERROR':
return `${baseUrl}/api-reference`;

case 'RATE_LIMIT_ERROR':
return `${baseUrl}/rate-limiting`;

default:
return `${baseUrl}/troubleshooting`;
}
```

}
}

// Request tracking for error context
const requestTracker = new Map<string, {
startTime: number;
route: string;
method: string;
}>();

/**

- Request tracking middleware (should be used early in the middleware chain)
  */
  export const requestTrackingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
  ): void => {
  const requestId = generateRequestId();
  const startTime = Date.now();

// Add request ID to request object
(req as any).requestId = requestId;

// Track request
requestTracker.set(requestId, {
startTime,
route: req.route?.path || req.path,
method: req.method,
});

// Add request ID to response headers
res.setHeader(‘X-Request-ID’, requestId);

// Clean up tracking data when response finishes
res.on(‘finish’, () => {
requestTracker.delete(requestId);
});

next();
};

/**

- Main error handling middleware
  */
  export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
  ): void => {
  // Skip if response already sent
  if (res.headersSent) {
  return next(error);
  }

// Classify and normalize the error
const appError = ErrorHandler.classifyError(error);

// Generate request ID if not present
const requestId = (req as any).requestId || generateRequestId();

// Log the error
ErrorLogger.log(appError, req, {
requestId,
originalError: error !== appError ? error.message : undefined,
});

// Prepare error response
const errorResponse: ErrorResponse = {
success: false,
error: appError.message,
code: appError.code,
statusCode: appError.statusCode,
timestamp: new Date().toISOString(),
path: req.originalUrl,
method: req.method,
requestId,
};

// Add additional details for validation errors
if (appError.details) {
errorResponse.details = appError.details;
}

// Add suggestions and documentation in development or for operational errors
if (config.isDevelopment || appError.isOperational) {
const suggestion = ErrorHandler.getErrorSuggestion(appError);
if (suggestion) {
errorResponse.suggestion = suggestion;
}

```
const documentation = ErrorHandler.getDocumentationLink(appError);
if (documentation) {
errorResponse.documentation = documentation;
}
```

}

// Include stack trace in development
if (config.isDevelopment && appError.stack) {
errorResponse.stack = appError.stack;
}

// Send error response
res.status(appError.statusCode).json(errorResponse);
};

/**

- 404 handler for unmatched routes
  */
  export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
  ): void => {
  const error = new NotFoundError(‘Endpoint’);
  next(error);
  };

/**

- Async error wrapper for route handlers
  */
  export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) => {
  return (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res, next).catch(next);
  };
  };

/**

- Error monitoring and metrics
  */
  export class ErrorMetrics {
  private static errorCounts = new Map<string, number>();
  private static lastReset = Date.now();

static incrementError(code: string): void {
const current = this.errorCounts.get(code) || 0;
this.errorCounts.set(code, current + 1);
}

static getErrorStats(): {
errorCounts: Record<string, number>;
totalErrors: number;
timePeriod: string;
} {
const now = Date.now();
const timePeriod = `${Math.round((now - this.lastReset) / 1000 / 60)} minutes`;

```
const errorCounts: Record<string, number> = {};
let totalErrors = 0;

for (const [code, count] of this.errorCounts.entries()) {
errorCounts[code] = count;
totalErrors += count;
}

return {
errorCounts,
totalErrors,
timePeriod,
};
```

}

static reset(): void {
this.errorCounts.clear();
this.lastReset = Date.now();
}
}

// Utility functions
function generateRequestId(): string {
return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**

- Process uncaught exceptions and unhandled rejections
  */
  export const setupGlobalErrorHandlers = (): void => {
  process.on(‘uncaughtException’, (error: Error) => {
  console.error(‘💥 Uncaught Exception:’, error);

  // Log to external service in production
  if (config.isProduction) {
  // TODO: Send to external logging service
  // await sendToSentry(error);
  }

  // Graceful shutdown
  process.exit(1);
  });

process.on(‘unhandledRejection’, (reason: any, promise: Promise<any>) => {
console.error(‘💥 Unhandled Rejection at:’, promise, ‘reason:’, reason);

```
// Log to external service in production
if (config.isProduction) {
  // TODO: Send to external logging service
  // await sendToSentry(new Error(reason));
}

// In production, consider graceful shutdown
if (config.isProduction) {
process.exit(1);
}
```

});

// Handle SIGTERM gracefully
process.on(‘SIGTERM’, () => {
console.log(‘👋 SIGTERM received, shutting down gracefully’);
process.exit(0);
});

// Handle SIGINT gracefully (Ctrl+C)
process.on(‘SIGINT’, () => {
console.log(‘👋 SIGINT received, shutting down gracefully’);
process.exit(0);
});
};

// Health check endpoint helper
export const createHealthCheckHandler = () => {
return async (req: Request, res: Response): Promise<void> => {
try {
const errorStats = ErrorMetrics.getErrorStats();

```
res.status(200).json({
success: true,
status: 'healthy',
timestamp: new Date().toISOString(),
uptime: process.uptime(),
memory: process.memoryUsage(),
errors: errorStats,
});
} catch (error) {
res.status(503).json({
success: false,
status: 'unhealthy',
error: 'Health check failed',
timestamp: new Date().toISOString(),
});
}
```

};
};

ConflictError,
RateLimitError,
ServiceUnavailableError,
errorHandler,
notFoundHandler,
asyncHandler,
requestTrackingMiddleware,
ErrorMetrics,
setupGlobalErrorHandlers,
createHealthCheckHandler,
};

export default {
AppError,
ValidationError,
AuthenticationError,
AuthorizationError,
NotFoundError,
ConflictError,
RateLimitError,
ServiceUnavailableError,
errorHandler,
notFoundHandler,
asyncHandler,
requestTrackingMiddleware,
ErrorMetrics,
setupGlobalErrorHandlers,
createHealthCheckHandler,
};
