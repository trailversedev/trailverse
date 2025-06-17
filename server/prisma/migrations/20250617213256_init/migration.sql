-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'PREMIUM', 'RANGER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MODERATE', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "TrailType" AS ENUM ('LOOP', 'OUT_AND_BACK', 'POINT_TO_POINT', 'NETWORK');

-- CreateEnum
CREATE TYPE "TrailCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CLOSED');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED');

-- CreateEnum
CREATE TYPE "CrowdLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('DAY_TRIP', 'OVERNIGHT_CAMPING', 'BACKPACKING', 'RV_CAMPING', 'LODGE_STAY', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ReviewSentiment" AS ENUM ('VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FavoriteCategory" AS ENUM ('WISHLIST', 'VISITED', 'RECOMMENDED', 'BUCKET_LIST');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('EXPLORATION', 'SOCIAL', 'CONSERVATION', 'PHOTOGRAPHY', 'HIKING', 'CAMPING');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('FRIEND', 'FOLLOWER', 'FAMILY');

-- CreateEnum
CREATE TYPE "CrowdDataSource" AS ENUM ('USER_REPORT', 'SENSOR_DATA', 'AI_PREDICTION', 'PARK_SERVICE', 'SATELLITE');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('RECOMMENDATION', 'PREDICTION', 'CLASSIFICATION', 'NLP', 'COMPUTER_VISION', 'CLUSTERING');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'CLICK', 'SEARCH', 'PURCHASE', 'SIGNUP', 'LOGIN', 'PARK_VIEW', 'TRIP_CREATE', 'REVIEW_CREATE', 'FAVORITE_ADD');

-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('CROWD_REPORT', 'WEATHER_ALERT', 'WILDLIFE_SIGHTING', 'TRAIL_CONDITION', 'PARKING_STATUS', 'GENERAL_INFO');

-- CreateEnum
CREATE TYPE "UpdateSeverity" AS ENUM ('LOW', 'INFO', 'WARNING', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ContestCategory" AS ENUM ('LANDSCAPE', 'WILDLIFE', 'MACRO', 'PEOPLE', 'SUNRISE_SUNSET', 'ADVENTURE');

-- CreateEnum
CREATE TYPE "ChatCategory" AS ENUM ('GENERAL_INFO', 'TRAIL_CONDITIONS', 'WEATHER', 'WILDLIFE', 'PERMITS', 'ACCESSIBILITY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChatPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER', 'SOCIAL', 'MARKETING');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('WEATHER_ALERT', 'TRIP_REMINDER', 'SOCIAL_UPDATE', 'PARK_ALERT', 'ACHIEVEMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "lastLoginAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "verificationToken" TEXT,
    "location" TEXT,
    "timeZone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "isPublicProfile" BOOLEAN NOT NULL DEFAULT true,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredActivities" TEXT[],
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'MODERATE',
    "accessibilityNeeds" TEXT[],
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "weatherAlerts" BOOLEAN NOT NULL DEFAULT true,
    "crowdAlerts" BOOLEAN NOT NULL DEFAULT false,
    "enableAIRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "enableVoiceFeatures" BOOLEAN NOT NULL DEFAULT true,
    "enableARFeatures" BOOLEAN NOT NULL DEFAULT true,
    "personalizedContent" BOOLEAN NOT NULL DEFAULT true,
    "shareLocation" BOOLEAN NOT NULL DEFAULT false,
    "shareTrips" BOOLEAN NOT NULL DEFAULT true,
    "sharePhotos" BOOLEAN NOT NULL DEFAULT true,
    "allowDataCollection" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parks" (
    "id" TEXT NOT NULL,
    "npsId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "elevation" INTEGER,
    "area" DOUBLE PRECISION,
    "timeZone" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "zipCode" TEXT,
    "activities" TEXT[],
    "amenities" TEXT[],
    "accessibility" TEXT[],
    "entranceFees" JSONB,
    "featuredImage" TEXT,
    "images" TEXT[],
    "videos" TEXT[],
    "virtualTourUrl" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "operatingHours" JSONB,
    "seasonInfo" JSONB,
    "alertLevel" "AlertLevel" NOT NULL DEFAULT 'GREEN',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorsPerYear" INTEGER,
    "peakSeason" TEXT,
    "crowdLevel" "CrowdLevel" NOT NULL DEFAULT 'MODERATE',
    "weatherRating" DOUBLE PRECISION DEFAULT 0,
    "aiDescription" TEXT,
    "recommendationScore" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trails" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "elevationGain" INTEGER,
    "estimatedTime" INTEGER NOT NULL,
    "trailType" "TrailType" NOT NULL,
    "startLatitude" DOUBLE PRECISION,
    "startLongitude" DOUBLE PRECISION,
    "endLatitude" DOUBLE PRECISION,
    "endLongitude" DOUBLE PRECISION,
    "gpxData" TEXT,
    "features" TEXT[],
    "accessibility" TEXT[],
    "seasonality" TEXT[],
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "condition" "TrailCondition" NOT NULL DEFAULT 'GOOD',
    "lastMaintained" TIMESTAMP(3),
    "images" TEXT[],
    "mapUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "accessibilityRating" INTEGER,
    "amenitiesRating" INTEGER,
    "sceneryRating" INTEGER,
    "crowdRating" INTEGER,
    "visitType" "VisitType" NOT NULL,
    "groupSize" INTEGER,
    "visitDuration" INTEGER,
    "activities" TEXT[],
    "bestTimeOfYear" TEXT[],
    "images" TEXT[],
    "videos" TEXT[],
    "sentiment" "ReviewSentiment",
    "aiSummary" TEXT,
    "helpfulnessScore" DOUBLE PRECISION DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "moderatedAt" TIMESTAMP(3),
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "unhelpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "totalDistance" DOUBLE PRECISION,
    "estimatedCost" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowCollaboration" BOOLEAN NOT NULL DEFAULT false,
    "shareCode" TEXT,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiRecommendations" JSONB,
    "optimizedRoute" JSONB,
    "status" "TripStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "activities" TEXT[],
    "notes" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "accommodation" TEXT,
    "recommendedDuration" INTEGER,
    "optimalTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_collaborators" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "status" "CollaborationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "trip_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "category" "FavoriteCategory" NOT NULL DEFAULT 'WISHLIST',
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "requirements" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectedUserId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "connectionType" "ConnectionType" NOT NULL DEFAULT 'FRIEND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_data" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" INTEGER,
    "pressure" DOUBLE PRECISION,
    "visibility" DOUBLE PRECISION,
    "uvIndex" DOUBLE PRECISION,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "cloudCover" INTEGER,
    "precipitation" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "forecastDate" TIMESTAMP(3),
    "aiPrediction" JSONB,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crowd_data" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "crowdLevel" "CrowdLevel" NOT NULL,
    "capacity" INTEGER,
    "waitTime" INTEGER,
    "parkingSpaces" INTEGER,
    "area" TEXT,
    "entrance" TEXT,
    "source" "CrowdDataSource" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crowd_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "parameters" JSONB,
    "metrics" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "deployedAt" TIMESTAMP(3),
    "lastTrainedAt" TIMESTAMP(3),
    "accuracy" DOUBLE PRECISION,
    "latency" INTEGER,
    "throughput" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "category" TEXT,
    "properties" JSONB,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_updates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "type" "UpdateType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "location" TEXT,
    "images" TEXT[],
    "videos" TEXT[],
    "severity" "UpdateSeverity" NOT NULL DEFAULT 'INFO',
    "tags" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_contest_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" "ContestCategory" NOT NULL,
    "contestMonth" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "captureDate" TIMESTAMP(3),
    "cameraSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_contest_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranger_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT,
    "category" "ChatCategory" NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ChatPriority" NOT NULL DEFAULT 'NORMAL',
    "rangerId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "isHelpful" BOOLEAN,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranger_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory",
    "actionUrl" TEXT,
    "actionText" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "channels" TEXT[],
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parks_npsId_key" ON "parks"("npsId");

-- CreateIndex
CREATE UNIQUE INDEX "parks_slug_key" ON "parks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "trips_shareCode_key" ON "trips"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "trip_collaborators_tripId_email_key" ON "trip_collaborators"("tripId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_parkId_key" ON "favorites"("userId", "parkId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "achievements"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "social_connections_userId_connectedUserId_key" ON "social_connections"("userId", "connectedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_name_key" ON "ml_models"("name");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trails" ADD CONSTRAINT "trails_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crowd_data" ADD CONSTRAINT "crowd_data_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_updates" ADD CONSTRAINT "live_updates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_updates" ADD CONSTRAINT "live_updates_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_contest_entries" ADD CONSTRAINT "photo_contest_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_contest_entries" ADD CONSTRAINT "photo_contest_entries_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "parks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranger_chats" ADD CONSTRAINT "ranger_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
