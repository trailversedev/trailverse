// server/src/routes/parks.ts
import { Router } from 'express';
import { PrismaClient, CrowdLevel } from '@prisma/client';
import { DatabaseHelpers, CommonQueries } from '../config/database';
import { RedisHelpers, RedisKeys } from '../config/redis';
import {
  authenticateToken,
  optionalAuth,
  requireVerifiedEmail,
  userRateLimit
} from '../middleware/auth';
import {
  validate,
  parkValidation,
  commonValidation,
  schemas
} from '../middleware/validation';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
  AuthenticationError
} from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// ===============================
// 🔍 SEARCH & DISCOVERY ROUTES
// ===============================

/**
 * Search parks with filtering and pagination
 * GET /api/parks
 */
router.get('/',
  optionalAuth,
  parkValidation.search,
  asyncHandler(async (req, res) => {
    const {
      query,
      state,
      activities,
      features,
      difficulty,
      minRating,
      maxDistance,
      lat,
      lng,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeClosed = false,
      premiumOnly = false
    } = req.query;

    // Build where clause dynamically
    const whereClause: any = {
      isActive: true,
      ...(includeClosed ? {} : { isOpen: true }),
      ...(premiumOnly ? { isPremium: true } : {}),
      ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
      ...(minRating ? { rating: { gte: Number(minRating) } } : {}),
    };

    // Search in name and description
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Filter by activities
    if (activities && Array.isArray(activities)) {
      whereClause.activities = {
        some: {
          name: { in: activities }
        }
      };
    }

    // Filter by features
    if (features && Array.isArray(features)) {
      whereClause.features = {
        hasSome: features
      };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder };
        break;
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'popularity':
        orderBy = { popularityScore: sortOrder };
        break;
      case 'established':
        orderBy = { established: sortOrder };
        break;
      default:
        orderBy = { popularityScore: 'desc' };
    }

    try {
      // Use database helpers for pagination
      const result = await DatabaseHelpers.paginate(
        ({ skip, take }) => prisma.park.findMany({
          skip,
          take,
          where: whereClause,
          orderBy,
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            },
            activities: {
              where: { isPopular: true },
              take: 5
            },
            _count: {
              select: {
                reviews: true,
                favorites: true
              }
            }
          }
        }),
        () => prisma.park.count({ where: whereClause }),
        Number(page),
        Number(limit)
      );

      // Get filter options for frontend
      const [states, allActivities, allFeatures] = await Promise.all([
        prisma.park.groupBy({
          by: ['state'],
          _count: true,
          orderBy: { state: 'asc' }
        }),
        prisma.activity.groupBy({
          by: ['name', 'category'],
          _count: true,
          orderBy: { _count: { _all: 'desc' } }
        }),
        prisma.park.findMany({
          select: { features: true },
          distinct: ['features']
        })
      ]);

      // Process features (since it's a string array)
      const featuresSet = new Set<string>();
      allFeatures.forEach(park => {
        park.features.forEach(feature => featuresSet.add(feature));
      });

      res.json({
        success: true,
        data: {
          parks: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          filters: {
            states: states.map(s => ({
              value: s.state,
              label: s.state,
              count: s._count
            })),
            activities: allActivities.map(a => ({
              value: a.name,
              label: a.name,
              category: a.category,
              count: a._count
            })),
            features: Array.from(featuresSet).map(f => ({
              value: f,
              label: f,
              count: 1 // Would need separate query for accurate count
            }))
          }
        }
      });
    } catch (error) {
      console.error('Park search error:', error);
      throw new ValidationError('Search failed. Please try again.');
    }
  })
);

/**
 * Get featured parks
 * GET /api/parks/featured
 */
router.get('/featured',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    // Try to get from cache first
    const cacheKey = RedisKeys.parkCache(`featured:${limit}`);
    const cached = await RedisHelpers.getJSON(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const featuredParks = await prisma.park.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        isOpen: true
      },
      take: limit,
      orderBy: { popularityScore: 'desc' },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        activities: {
          where: { isPopular: true },
          take: 3
        }
      }
    });

    // Cache for 1 hour
    await RedisHelpers.setJSON(cacheKey, featuredParks, 3600);

    res.json({
      success: true,
      data: featuredParks
    });
  })
);

/**
 * Get popular parks
 * GET /api/parks/popular
 */
router.get('/popular',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const timeframe = req.query.timeframe as 'week' | 'month' | 'year' || 'month';

    const popularParks = await prisma.park.findMany({
      where: {
        isActive: true,
        isOpen: true
      },
      take: limit,
      orderBy: [
        { popularityScore: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        activities: {
          where: { isPopular: true },
          take: 3
        }
      }
    });

    res.json({
      success: true,
      data: popularParks,
      timeframe
    });
  })
);

/**
 * Get nearby parks
 * GET /api/parks/nearby
 */
router.get('/nearby',
  optionalAuth,
  validate(z.object({
    lat: z.string().transform(Number),
    lng: z.string().transform(Number),
    radius: z.string().transform(Number).optional().default('100'),
    limit: z.string().transform(Number).optional().default('10')
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { lat, lng, radius, limit } = req.query;

    // Use raw SQL for distance calculation
    const nearbyParks = await prisma.$queryRaw`
      SELECT p.*,
             ( 3959 * acos( cos( radians(${lat}) )
             * cos( radians( (p.coordinates->>'latitude')::float ) )
             * cos( radians( (p.coordinates->>'longitude')::float ) - radians(${lng}) )
             + sin( radians(${lat}) )
             * sin( radians( (p.coordinates->>'latitude')::float ) ) ) ) AS distance
      FROM "Park" p
      WHERE p."isActive" = true
      AND p."isOpen" = true
      HAVING distance < ${radius}
      ORDER BY distance
      LIMIT ${limit}
    `;

    res.json({
      success: true,
      data: nearbyParks
    });
  })
);

// ===============================
// 🏞️ INDIVIDUAL PARK ROUTES
// ===============================

/**
 * Get park by ID or slug
 * GET /api/parks/:identifier
 */
router.get('/:identifier',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const userId = req.user?.id;

    // Try to find by ID first, then by slug
    let park = await prisma.park.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ],
        isActive: true
      },
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        activities: {
          orderBy: [
            { isPopular: 'desc' },
            { name: 'asc' }
          ]
        },
        videos: true,
        virtualTours: true,
        fees: true,
        _count: {
          select: {
            reviews: true,
            favorites: true
          }
        }
      }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    // Check if user has favorited this park
    let isFavorited = false;
    if (userId) {
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId,
          parkId: park.id
        }
      });
      isFavorited = !!favorite;
    }

    // Increment view count (fire and forget)
    prisma.parkView.create({
      data: {
        parkId: park.id,
        userId: userId || null,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    }).catch(console.error);

    res.json({
      success: true,
      data: {
        ...park,
        isFavorited,
        viewCount: park._count || { reviews: 0, favorites: 0 }
      }
    });
  })
);

/**
 * Get park details with related information
 * GET /api/parks/:identifier/details
 */
router.get('/:identifier/details',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const include = req.query.include as string;
    const includeArray = include ? include.split(',') : [];

    const park = await prisma.park.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ],
        isActive: true
      },
      include: {
        images: true,
        activities: true,
        videos: true,
        virtualTours: true,
        fees: true
      }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    const result: any = { ...park };

    // Include reviews if requested
    if (includeArray.includes('reviews')) {
      result.reviews = await prisma.review.findMany({
        where: { parkId: park.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
    }

    // Include nearby parks if requested
    if (includeArray.includes('nearby')) {
      const coordinates = park.coordinates as any;
      if (coordinates?.latitude && coordinates?.longitude) {
        result.nearbyParks = await prisma.$queryRaw`
          SELECT p.*,
                 ( 3959 * acos( cos( radians(${coordinates.latitude}) )
                 * cos( radians( (p.coordinates->>'latitude')::float ) )
                 * cos( radians( (p.coordinates->>'longitude')::float ) - radians(${coordinates.longitude}) )
                 + sin( radians(${coordinates.latitude}) )
                 * sin( radians( (p.coordinates->>'latitude')::float ) ) ) ) AS distance
          FROM "Park" p
          WHERE p."isActive" = true
          AND p."isOpen" = true
          AND p."id" != ${park.id}
          HAVING distance < 100
          ORDER BY distance
          LIMIT 5
        `;
      }
    }

    // Include similar parks if requested
    if (includeArray.includes('similar')) {
      result.similarParks = await prisma.park.findMany({
        where: {
          id: { not: park.id },
          state: park.state,
          isActive: true,
          isOpen: true
        },
        take: 5,
        orderBy: { rating: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });
    }

    res.json({
      success: true,
      data: result
    });
  })
);

// ===============================
// 🌤️ CONDITIONS & WEATHER ROUTES
// ===============================

/**
 * Get park conditions and alerts
 * GET /api/parks/:id/conditions
 */
router.get('/:id/conditions',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check cache first
    const cacheKey = RedisKeys.parkCache(`conditions:${id}`);
    const cached = await RedisHelpers.getJSON(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const park = await prisma.park.findUnique({
      where: { id },
      select: { id: true, name: true, currentConditions: true }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    // In real app, fetch from NPS API or other sources
    const conditions = park.currentConditions || {
      status: 'open',
      alerts: [],
      roadConditions: [],
      trailConditions: [],
      lastUpdated: new Date().toISOString()
    };

    // Cache for 30 minutes
    await RedisHelpers.setJSON(cacheKey, conditions, 1800);

    res.json({
      success: true,
      data: conditions
    });
  })
);

/**
 * Get park weather information
 * GET /api/parks/:id/weather
 */
router.get('/:id/weather',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const days = Math.min(Number(req.query.days) || 7, 14);

    // Check cache first
    const cacheKey = RedisKeys.weatherCache(id);
    const cached = await RedisHelpers.getJSON(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const park = await prisma.park.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        coordinates: true,
        weatherInfo: true
      }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    // In real app, fetch from weather API
    const weatherInfo = park.weatherInfo || {
      current: {
        temperature: 72,
        feelsLike: 75,
        humidity: 65,
        windSpeed: 8,
        windDirection: 'NW',
        visibility: 10,
        uvIndex: 6,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy'
      },
      forecast: [],
      lastUpdated: new Date().toISOString()
    };

    // Cache for 15 minutes
    await RedisHelpers.setJSON(cacheKey, weatherInfo, 900);

    res.json({
      success: true,
      data: weatherInfo
    });
  })
);

/**
 * Get park crowd levels
 * GET /api/parks/:id/crowds
 */
router.get('/:id/crowds',
  optionalAuth,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const days = Math.min(Number(req.query.days) || 7, 14);

    const park = await prisma.park.findUnique({
      where: { id },
      select: { id: true, name: true, crowdLevel: true }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    const crowdLevel = park.crowdLevel || CrowdLevel.MEDIUM;

    res.json({
      success: true,
      data: {
        current: crowdLevel.toLowerCase(),
        prediction: [], // Would be populated by ML service
        factors: ['Weather', 'Seasonality', 'Events'],
        lastUpdated: new Date().toISOString()
      }
    });
  })
);

// ===============================
// ⭐ FAVORITES ROUTES
// ===============================

/**
 * Add park to favorites
 * POST /api/parks/:id/favorite
 */
router.post('/:id/favorite',
  authenticateToken,
  requireVerifiedEmail,
  userRateLimit(10, 60 * 1000), // 10 per minute
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if park exists
    const park = await prisma.park.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!park) {
      throw new NotFoundError('Park');
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: { userId, parkId: id }
    });

    if (existingFavorite) {
      return res.json({
        success: true,
        message: 'Park already in favorites',
        data: { alreadyFavorited: true }
      });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId,
        parkId: id
      }
    });

    // Update park favorite count
    await prisma.park.update({
      where: { id },
      data: {
        favoriteCount: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Park added to favorites',
      data: { favorited: true }
    });
  })
);

/**
 * Remove park from favorites
 * DELETE /api/parks/:id/favorite
 */
router.delete('/:id/favorite',
  authenticateToken,
  requireVerifiedEmail,
  commonValidation.idParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const favorite = await prisma.favorite.findFirst({
      where: { userId, parkId: id }
    });

    if (!favorite) {
      return res.json({
        success: true,
        message: 'Park not in favorites',
        data: { notFavorited: true }
      });
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: { id: favorite.id }
    });

    // Update park favorite count
    await prisma.park.update({
      where: { id },
      data: {
        favoriteCount: { decrement: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Park removed from favorites',
      data: { favorited: false }
    });
  })
);

/**
 * Get user's favorite parks
 * GET /api/parks/favorites
 */
router.get('/favorites',
  authenticateToken,
  requireVerifiedEmail,
  validate(z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('20'),
    sortBy: z.enum(['added', 'name', 'rating']).optional().default('added')
  }), 'query'),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { page, limit, sortBy } = req.query;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name') {
      orderBy = { park: { name: 'asc' } };
    } else if (sortBy === 'rating') {
      orderBy = { park: { rating: 'desc' } };
    }

    const result = await DatabaseHelpers.paginate(
      ({ skip, take }) => prisma.favorite.findMany({
        skip,
        take,
        where: { userId },
        orderBy,
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
      () => prisma.favorite.count({ where: { userId } }),
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: {
        parks: result.data.map(fav => fav.park),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  })
);

// ===============================
// 📊 STATISTICS ROUTES
// ===============================

/**
 * Get park statistics
 * GET /api/parks/stats
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    // Check cache first
    const cacheKey = 'park_stats';
    const cached = await RedisHelpers.getJSON(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const [
      totalParks,
      totalVisitors,
      averageRating,
      mostPopular,
      recentlyAdded
    ] = await Promise.all([
      prisma.park.count({ where: { isActive: true } }),
      prisma.park.aggregate({
        _sum: { visitors: true },
        where: { isActive: true }
      }),
      prisma.park.aggregate({
        _avg: { rating: true },
        where: { isActive: true }
      }),
      prisma.park.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { popularityScore: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      }),
      prisma.park.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      })
    ]);

    const stats = {
      totalParks,
      totalVisitors: totalVisitors._sum.visitors || 0,
      averageRating: Number((averageRating._avg.rating || 0).toFixed(1)),
      mostPopular,
      recentlyAdded,
      trending: mostPopular // Simplified - would use analytics in real app
    };

    // Cache for 1 hour
    await RedisHelpers.setJSON(cacheKey, stats, 3600);

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;
