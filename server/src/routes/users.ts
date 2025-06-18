// server/src/routes/users.ts
import { Router } from 'express';
import { PrismaClient, UserRole, EventType } from '@prisma/client';
import { DatabaseHelpers, CommonQueries } from '../config/database';
import { RedisHelpers, RedisKeys } from '../config/redis';
import { config } from '../config/environment';
import {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireVerifiedEmail,
  requireOwnership,
  userRateLimit
} from '../middleware/auth';
import {
  validate,
  commonValidation,
  validateFileUpload,
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
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  }
});

// ===============================
// 🔍 USER DISCOVERY & SEARCH
// ===============================

/**
 * Search users (Admin only)
 * GET /api/users
 */
router.get('/',
  authenticateToken,
  requireAdmin,
  validate(z.object({
    search: z.string().optional(),
    role: z.enum(['USER', 'PREMIUM', 'RANGER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
    isVerified: z.string().transform(val => val === 'true').optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20')
  }), 'query'),
  asyncHandler(async (req, res) => {
    const {
      search,
      role,
      isActive,
      isVerified,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive;
    if (isVerified !== undefined) whereClause.isVerified = isVerified;

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.user.findMany({
        skip,
        take,
        where: whereClause,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
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
      }),
      () => prisma.user.count({ where: whereClause }),
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Get user statistics (Admin only)
 * GET /api/users/stats
 */
router.get('/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month' | 'year') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      totalUsers,
      activeUsers,
      newUsers,
      verifiedUsers,
      roleDistribution,
      topContributors
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: { gte: startDate }
        }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.user.count({
        where: { isVerified: true }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: {
          reviews: { _count: 'desc' }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          _count: {
            select: {
              reviews: true,
              favorites: true,
              trips: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsers,
          verifiedUsers,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0
        },
        roleDistribution: roleDistribution.map(r => ({
          role: r.role,
          count: r._count,
          percentage: totalUsers > 0 ? (r._count / totalUsers * 100).toFixed(1) : 0
        })),
        topContributors,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });
  })
);

// ===============================
// 👤 INDIVIDUAL USER ROUTES
// ===============================

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requestingUserId = req.user?.id;
    const isAdmin = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const isOwner = requestingUserId === id;

    // Determine what data to include based on permissions
    const selectFields: any = {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          favorites: true,
          trips: true
        }
      }
    };

    // Include additional fields for owner or admin
    if (isOwner || isAdmin) {
      selectFields.email = true;
      selectFields.isActive = true;
      selectFields.lastLoginAt = true;
      selectFields.preferences = true;
      selectFields.metadata = true;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: selectFields
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user profile is private (unless owner or admin)
    if (!user.isActive && !isOwner && !isAdmin) {
      throw new NotFoundError('User');
    }

    // Get recent activity if viewing own profile or admin
    let recentActivity = null;
    if (isOwner || isAdmin) {
      recentActivity = await prisma.review.findMany({
        where: { userId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          park: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        user,
        recentActivity,
        canEdit: isOwner,
        viewedBy: requestingUserId
      }
    });
  })
);

/**
 * Update user profile
 * PATCH /api/users/:id
 */
router.patch('/:id',
  authenticateToken,
  requireOwnership(),
  validate(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    preferences: z.object({
      notifications: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      language: z.string().max(10).optional(),
      timezone: z.string().max(50).optional(),
      privacy: z.object({
        showEmail: z.boolean().optional(),
        showActivity: z.boolean().optional(),
        showFavorites: z.boolean().optional()
      }).optional()
    }).optional()
  })),
  userRateLimit(5, 60 * 1000), // 5 updates per minute
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id },
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
      userId: id,
      eventName: 'profile_updated',
      eventType: EventType.ENGAGEMENT,
      category: 'user_management',
      properties: {
        fieldsUpdated: Object.keys(updateData),
        updateSource: 'profile_page'
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

/**
 * Upload user avatar
 * POST /api/users/:id/avatar
 */
router.post('/:id/avatar',
  authenticateToken,
  requireOwnership(),
  upload.single('avatar'),
  validateFileUpload(),
  userRateLimit(3, 60 * 1000), // 3 uploads per minute
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new ValidationError('Avatar image is required');
    }

    // In a real application, you would:
    // 1. Upload to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Generate different sizes/thumbnails
    // 3. Store the URLs in the database

    // For now, we'll simulate this
    const avatarUrl = `https://api.trailverse.com/uploads/avatars/${id}/${Date.now()}.jpg`;
    const thumbnailUrl = `https://api.trailverse.com/uploads/avatars/${id}/thumb_${Date.now()}.jpg`;

    // Update user with new avatar URL
    const user = await prisma.user.update({
      where: { id },
      data: {
        avatar: avatarUrl,
        avatarThumbnail: thumbnailUrl
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        avatarThumbnail: true
      }
    });

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: id,
      eventName: 'avatar_uploaded',
      eventType: EventType.ENGAGEMENT,
      category: 'user_management',
      properties: {
        fileSize: file.size,
        fileType: file.mimetype
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user }
    });
  })
);

/**
 * Delete user avatar
 * DELETE /api/users/:id/avatar
 */
router.delete('/:id/avatar',
  authenticateToken,
  requireOwnership(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        avatar: null,
        avatarThumbnail: null
      },
      select: {
        id: true,
        name: true,
        avatar: true
      }
    });

    res.json({
      success: true,
      message: 'Avatar removed successfully',
      data: { user }
    });
  })
);

// ===============================
// 👥 USER RELATIONSHIPS
// ===============================

/**
 * Get user's reviews
 * GET /api/users/:id/reviews
 */
router.get('/:id/reviews',
  optionalAuth,
  commonValidation.idParam,
  commonValidation.pagination,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const requestingUserId = req.user?.id;
    const isOwner = requestingUserId === id;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, preferences: true }
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    // Check privacy settings
    const showActivity = user.preferences?.privacy?.showActivity !== false;
    if (!showActivity && !isOwner) {
      throw new AuthorizationError('User activity is private');
    }

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.review.findMany({
        skip,
        take,
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          park: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),
      () => prisma.review.count({ where: { userId: id } }),
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * Get user's favorite parks
 * GET /api/users/:id/favorites
 */
router.get('/:id/favorites',
  optionalAuth,
  commonValidation.idParam,
  commonValidation.pagination,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    const requestingUserId = req.user?.id;
    const isOwner = requestingUserId === id;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true, preferences: true }
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    // Check privacy settings
    const showFavorites = user.preferences?.privacy?.showFavorites !== false;
    if (!showFavorites && !isOwner) {
      throw new AuthorizationError('User favorites are private');
    }

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.favorite.findMany({
        skip,
        take,
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          park: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),
      () => prisma.favorite.count({ where: { userId: id } }),
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: {
        ...result,
        data: result.data.map(fav => fav.park)
      }
    });
  })
);

/**
 * Get user's trips
 * GET /api/users/:id/trips
 */
router.get('/:id/trips',
  authenticateToken,
  requireOwnership(),
  commonValidation.pagination,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.trip.findMany({
        skip,
        take,
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          parks: {
            include: {
              park: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              }
            }
          }
        }
      }),
      () => prisma.trip.count({ where: { userId: id } }),
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: result
    });
  })
);

// ===============================
// 🔧 ADMIN USER MANAGEMENT
// ===============================

/**
 * Create user (Admin only)
 * POST /api/users
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  validate(z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    role: z.enum(['USER', 'PREMIUM', 'RANGER', 'ADMIN']),
    isActive: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(true)
  })),
  asyncHandler(async (req, res) => {
    const { name, email, role, isActive, sendWelcomeEmail } = req.body;
    const adminId = req.user!.id;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Generate secure password
    const tempPassword = authService.generateSecurePassword(12);
    const hashedPassword = await authService.hashPassword(tempPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        isActive,
        isVerified: true, // Admin-created users are auto-verified
        emailVerifiedAt: new Date(),
        metadata: {
          createdBy: adminId,
          createdViaAdmin: true,
          tempPassword: sendWelcomeEmail // Flag to indicate temp password sent
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Log analytics event
    await authService.logAnalyticsEvent({
      userId: adminId,
      eventName: 'user_created_by_admin',
      eventType: EventType.CONVERSION,
      category: 'admin_action',
      properties: {
        createdUserId: user.id,
        userRole: role,
        sendWelcomeEmail
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    // TODO: Send welcome email with temporary password
    if (sendWelcomeEmail) {
      // await emailService.sendWelcomeEmail(user.email, user.name, tempPassword);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        tempPassword: sendWelcomeEmail ? tempPassword : undefined
      }
    });
  })
);

/**
 * Update user role (Admin only)
 * PATCH /api/users/:id/role
 */
router.patch('/:id/role',
  authenticateToken,
  requireAdmin,
  validate(z.object({
    role: z.enum(['USER', 'PREMIUM', 'RANGER', 'ADMIN']),
    reason: z.string().max(200).optional()
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, reason } = req.body;
    const adminId = req.user!.id;

    // Prevent self-modification by non-super-admin
    if (id === adminId && req.user!.role !== 'SUPER_ADMIN') {
      throw new AuthorizationError('Cannot modify your own role');
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!currentUser) {
      throw new NotFoundError('User');
    }

    // Prevent modifying super admin (unless you are super admin)
    if (currentUser.role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      throw new AuthorizationError('Cannot modify super admin user');
    }

    // Update user role
    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Log the role change
    await authService.logAnalyticsEvent({
      userId: adminId,
      eventName: 'user_role_changed',
      eventType: EventType.ENGAGEMENT,
      category: 'admin_action',
      properties: {
        targetUserId: id,
        previousRole: currentUser.role,
        newRole: role,
        reason
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });
  })
);

/**
 * Activate/Deactivate user (Admin only)
 * PATCH /api/users/:id/status
 */
router.patch('/:id/status',
  authenticateToken,
  requireAdmin,
  validate(z.object({
    isActive: z.boolean(),
    reason: z.string().max(200).optional()
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive, reason } = req.body;
    const adminId = req.user!.id;

    // Prevent self-modification
    if (id === adminId) {
      throw new AuthorizationError('Cannot modify your own account status');
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    // If deactivating, invalidate all user sessions
    if (!isActive) {
      await authService.invalidateAllUserSessions(id);
      await revokeUserTokens(id);
    }

    // Log the status change
    await authService.logAnalyticsEvent({
      userId: adminId,
      eventName: isActive ? 'user_activated' : 'user_deactivated',
      eventType: EventType.ENGAGEMENT,
      category: 'admin_action',
      properties: {
        targetUserId: id,
        reason
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  })
);

/**
 * Delete user (Super Admin only)
 * DELETE /api/users/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRole(UserRole.SUPER_ADMIN),
  validate(z.object({
    reason: z.string().min(10, 'Deletion reason is required (minimum 10 characters)'),
    transferData: z.boolean().default(false)
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, transferData } = req.body;
    const adminId = req.user!.id;

    // Prevent self-deletion
    if (id === adminId) {
      throw new AuthorizationError('Cannot delete your own account');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

    // Use database transaction for safe deletion
    await DatabaseHelpers.executeTransaction(async (tx) => {
      if (transferData) {
        // Anonymize user data instead of deleting
        await tx.user.update({
          where: { id },
          data: {
            name: 'Deleted User',
            email: `deleted_${Date.now()}@trailverse.com`,
            password: 'DELETED',
            isActive: false,
            isVerified: false,
            deletedAt: new Date(),
            metadata: {
              ...user.metadata,
              deletedBy: adminId,
              deletionReason: reason,
              originalEmail: user.email
            }
          }
        });
      } else {
        // Hard delete user and related data
        await tx.favorite.deleteMany({ where: { userId: id } });
        await tx.review.deleteMany({ where: { userId: id } });
        await tx.trip.deleteMany({ where: { userId: id } });
        await tx.user.delete({ where: { id } });
      }
    });

    // Invalidate all user sessions
    await authService.invalidateAllUserSessions(id);

    // Log the deletion
    await authService.logAnalyticsEvent({
      userId: adminId,
      eventName: 'user_deleted',
      eventType: EventType.ENGAGEMENT,
      category: 'admin_action',
      properties: {
        deletedUserId: id,
        deletedUserEmail: user.email,
        reason,
        transferData,
        userDataCounts: user._count
      },
      sessionId: req.sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json({
      success: true,
      message: transferData ? 'User data anonymized successfully' : 'User deleted successfully'
    });
  })
);

export default router;
