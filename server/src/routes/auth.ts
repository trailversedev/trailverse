// server/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole, EventType } from '@prisma/client';
import { DatabaseHelpers } from '../config/database';
import { RedisHelpers, RedisKeys } from '../config/redis';
import { config } from '../config/environment';
import {
  authenticateToken,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  createSession,
  destroySession,
  revokeUserTokens,
  generateCSRFToken
} from '../middleware/auth';
import {
  validate,
  authValidation,
  validateRateLimit,
  validatePasswordStrength,
  sanitizeInput,
  schemas
} from '../middleware/validation';
import {
  asyncHandler,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  NotFoundError
} from '../middleware/errorHandler';
import { authService } from '../services/authService';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// ===============================
// 🔐 REGISTRATION & LOGIN
// ===============================

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register',
  ...authValidation.register,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, acceptTerms } = req.body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Generate verification token
    const verificationToken = authService.generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: UserRole.USER,
        isVerified: false,
        isActive: true,
        verificationToken,
        verificationExpires,
        metadata: {
          registrationIp: ipAddress,
          registrationUserAgent: userAgent,
          acceptedTermsAt: new Date().toISOString(),
          registrationSource: 'web'
        },
        preferences: {
          notifications: true,
          newsletter: false,
          theme: 'auto'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true
      }
    });

    // Create session
    const sessionId = await createSession(
      user.id,
      user.email,
      user.role,
      req
    );

    // Generate tokens
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user.id, sessionId);

    // Store refresh token
    const deviceInfo = authService.parseUserAgent(userAgent);
    await authService.storeRefreshToken(
      user.id,
      refreshToken,
      sessionId,
      {
        userAgent,
        ipAddress,
        ...deviceInfo
      }
    );

    // Store verification token in Redis
    const verificationKey = RedisKeys.emailVerification(verificationToken);
    await RedisHelpers.setJSON(verificationKey, {
      userId: user.id,
      email: user.email,
      token: verificationToken
    }, 24 * 60 * 60); // 24 hours

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: user.id,
      eventName: 'user_registered',
      eventType: EventType.CONVERSION,
      category: 'authentication',
      properties: {
        registrationMethod: 'email',
        hasAcceptedTerms: acceptTerms,
        userRole: user.role
      },
      sessionId,
      ipAddress,
      userAgent
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user,
        accessToken,
        expiresIn: config.auth.jwtExpiresIn,
        needsVerification: true
      }
    });
  })
);

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login',
  ...authValidation.login,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe = false } = req.body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check rate limiting
    const rateLimitCheck = await authService.checkLoginAttempts(email);
    if (!rateLimitCheck.allowed) {
      await authService.recordFailedLogin(email);
      throw new AuthenticationError(
        `Too many failed attempts. Try again in ${Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000 / 60)} minutes.`
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        loginCount: true
      }
    });

    if (!user) {
      await authService.recordFailedLogin(email);
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      await authService.recordFailedLogin(email);
      throw new AuthenticationError('Account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      await authService.recordFailedLogin(email);
      throw new AuthenticationError('Invalid email or password');
    }

    // Clear failed login attempts
    await authService.clearLoginAttempts(email);

    // Create session
    const sessionId = await createSession(
      user.id,
      user.email,
      user.role,
      req
    );

    // Generate tokens
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user.id, sessionId);

    // Store refresh token
    const deviceInfo = authService.parseUserAgent(userAgent);
    await authService.storeRefreshToken(
      user.id,
      refreshToken,
      sessionId,
      {
        userAgent,
        ipAddress,
        ...deviceInfo
      }
    );

    // Update user login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 }
      }
    });

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: user.id,
      eventName: 'user_logged_in',
      eventType: EventType.ENGAGEMENT,
      category: 'authentication',
      properties: {
        loginMethod: 'email',
        rememberMe,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      },
      sessionId,
      ipAddress,
      userAgent
    });

    // Set refresh token cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge,
      path: '/api/auth'
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        expiresIn: config.auth.jwtExpiresIn,
        needsVerification: !user.isVerified
      }
    });
  })
);

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
router.post('/refresh',
  validate(z.object({
    refreshToken: z.string().optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Validate refresh token in storage
      const isValid = await authService.validateRefreshToken(decoded.userId, refreshToken);
      if (!isValid) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new tokens
      const newSessionId = authService.generateUUID();
      const newAccessToken = generateAccessToken(user, newSessionId);
      const newRefreshToken = generateRefreshToken(user.id, newSessionId);

      // Replace old refresh token with new one
      await authService.replaceRefreshToken(
        user.id,
        refreshToken,
        newRefreshToken,
        newSessionId
      );

      // Update session
      await createSession(user.id, user.email, user.role, req);

      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth'
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user,
          accessToken: newAccessToken,
          expiresIn: config.auth.jwtExpiresIn
        }
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }
      throw error;
    }
  })
);

/**
 * Logout User
 * POST /api/auth/logout
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const sessionId = req.sessionId;
    const refreshToken = req.cookies.refreshToken;

    // Remove refresh token from storage
    if (refreshToken) {
      await authService.removeRefreshToken(refreshToken);
    }

    // Destroy session
    if (sessionId) {
      await destroySession(sessionId);
    }

    // Blacklist current access token
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token) as any;
      if (decoded?.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await authService.blacklistToken(token, expiresIn);
        }
      }
    }

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId,
      eventName: 'user_logged_out',
      eventType: EventType.ENGAGEMENT,
      category: 'authentication',
      sessionId: sessionId || undefined,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
router.post('/logout-all',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Invalidate all user sessions
    await authService.invalidateAllUserSessions(userId);

    // Revoke all tokens by incrementing token version
    await revokeUserTokens(userId);

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId,
      eventName: 'user_logged_out_all_devices',
      eventType: EventType.ENGAGEMENT,
      category: 'authentication',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  })
);

// ===============================
// 📧 EMAIL VERIFICATION
// ===============================

/**
 * Verify Email Address
 * POST /api/auth/verify-email
 */
router.post('/verify-email',
  validate(z.object({
    token: z.string().min(1, 'Verification token is required')
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    // Get verification data from Redis
    const verificationKey = RedisKeys.emailVerification(token);
    const verificationData = await RedisHelpers.getJSON(verificationKey);

    if (!verificationData) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { id: verificationData.userId },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationExpires: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true
      }
    });

    // Remove verification token from Redis
    await RedisHelpers.delete(verificationKey);

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: user.id,
      eventName: 'email_verified',
      eventType: EventType.CONVERSION,
      category: 'authentication',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { user }
    });
  })
);

/**
 * Resend Verification Email
 * POST /api/auth/resend-verification
 */
router.post('/resend-verification',
  validateRateLimit('email'),
  validate(z.object({
    email: z.string().email('Invalid email format')
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.'
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Generate new verification token
    const verificationToken = authService.generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires
      }
    });

    // Store in Redis
    const verificationKey = RedisKeys.emailVerification(verificationToken);
    await RedisHelpers.setJSON(verificationKey, {
      userId: user.id,
      email: user.email,
      token: verificationToken
    }, 24 * 60 * 60);

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  })
);

// ===============================
// 🔑 PASSWORD RESET
// ===============================

/**
 * Request Password Reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password',
  ...authValidation.passwordResetRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Check rate limiting
    const rateLimitCheck = await authService.checkPasswordResetAttempts(email);
    if (!rateLimitCheck.allowed) {
      throw new ValidationError(
        `Too many password reset attempts. Try again in ${Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000 / 60)} minutes.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    // Record attempt regardless of whether user exists
    await authService.recordPasswordResetAttempt(email);

    if (!user || !user.isActive) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent.'
      });
    }

    // Generate reset token
    const resetToken = authService.generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Store in Redis
    const resetKey = RedisKeys.passwordReset(resetToken);
    await RedisHelpers.setJSON(resetKey, {
      userId: user.id,
      email: user.email,
      token: resetToken
    }, 60 * 60); // 1 hour

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: user.id,
      eventName: 'password_reset_requested',
      eventType: EventType.ENGAGEMENT,
      category: 'authentication',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    // TODO: Send password reset email
    // await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  })
);

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
router.post('/reset-password',
  ...authValidation.passwordReset,
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    // Get reset data from Redis
    const resetKey = RedisKeys.passwordReset(token);
    const resetData = await RedisHelpers.getJSON(resetKey);

    if (!resetData) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(password);

    // Update user password
    const user = await prisma.user.update({
      where: { id: resetData.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Remove reset token from Redis
    await RedisHelpers.delete(resetKey);

    // Revoke all existing tokens
    await revokeUserTokens(user.id);
    await authService.invalidateAllUserSessions(user.id);

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: user.id,
      eventName: 'password_reset_completed',
      eventType: EventType.CONVERSION,
      category: 'authentication',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
      data: { user }
    });
  })
);

/**
 * Change Password (Authenticated)
 * POST /api/auth/change-password
 */
router.post('/change-password',
  authenticateToken,
  ...authValidation.changePassword,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        name: true
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await authService.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await authService.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    });

    // Revoke all tokens except current session
    await revokeUserTokens(userId);

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId,
      eventName: 'password_changed',
      eventType: EventType.ENGAGEMENT,
      category: 'authentication',
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

// ===============================
// 📱 SESSION MANAGEMENT
// ===============================

/**
 * Get User Sessions
 * GET /api/auth/sessions
 */
router.get('/sessions',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const currentSessionId = req.sessionId;

    const sessions = await authService.getUserSessions(userId);

    // Mark current session
    const sessionsWithInfo = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId,
      lastUsedFormatted: new Date(session.lastUsed).toLocaleString(),
      location: 'Unknown', // Would use IP geolocation service
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithInfo,
        total: sessions.length
      }
    });
  })
);

/**
 * Revoke Specific Session
 * DELETE /api/auth/sessions/:sessionId
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  validate(z.object({
    sessionId: z.string().min(1, 'Session ID is required')
  }), 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user!.id;
    const currentSessionId = req.sessionId;

    if (sessionId === currentSessionId) {
      throw new ValidationError('Cannot revoke current session. Use logout instead.');
    }

    // Find and remove the session
    const sessions = await authService.getUserSessions(userId);
    const sessionToRevoke = sessions.find(s => s.sessionId === sessionId);

    if (!sessionToRevoke) {
      throw new NotFoundError('Session');
    }

    // Remove the session (this would need to be implemented in authService)
    // For now, we'll destroy the session
    await destroySession(sessionId);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  })
);

// ===============================
// 👤 USER PROFILE
// ===============================

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        isVerified: true,
        isActive: true,
        preferences: true,
        metadata: true,
        createdAt: true,
        lastLoginAt: true,
        loginCount: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            trips: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

/**
 * Update User Profile
 * PATCH /api/auth/me
 */
router.patch('/me',
  authenticateToken,
  validate(z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    preferences: z.object({
      notifications: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional()
    }).optional()
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        preferences: true,
        updatedAt: true
      }
    });

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId,
      eventName: 'profile_updated',
      eventType: EventType.ENGAGEMENT,
      category: 'user_management',
      properties: {
        fieldsUpdated: Object.keys(updateData)
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  })
);

// ===============================
// 📊 AUTH STATISTICS
// ===============================

/**
 * Get Authentication Statistics (Admin only)
 * GET /api/auth/stats
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    // Check if user is admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new AuthorizationError('Admin access required');
    }

    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month') || 'day';
    const stats = await authService.getAuthStats(timeframe);

    res.json({
      success: true,
      data: stats,
      timeframe,
      generatedAt: new Date().toISOString()
    });
  })
);

export default router;
