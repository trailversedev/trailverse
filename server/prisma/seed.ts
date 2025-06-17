import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rangerChat.deleteMany();
  await prisma.photoContestEntry.deleteMany();
  await prisma.liveUpdate.deleteMany();
  await prisma.crowdData.deleteMany();
  await prisma.weatherData.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.socialConnection.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.tripCollaborator.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.review.deleteMany();
  await prisma.trail.deleteMany();
  await prisma.park.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mLModel.deleteMany();

  // 1. Create Users
  console.log('👤 Creating Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const krishna = await prisma.user.create({
    data: {
      email: 'krishna@trailverse.com',
      username: 'krishnasathvik',
      firstName: 'Krishna',
      lastName: 'Sathvik',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      location: 'San Francisco, CA',
      country: 'USA',
      state: 'California',
      city: 'San Francisco',
      timeZone: 'America/Los_Angeles',
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        create: {
          preferredActivities: ['hiking', 'photography', 'camping'],
          difficultyLevel: 'HARD',
          accessibilityNeeds: [],
          enableAIRecommendations: true,
          enableVoiceFeatures: true,
          enableARFeatures: true,
          personalizedContent: true,
          shareLocation: true,
          shareTrips: true,
          sharePhotos: true
        }
      }
    }
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah.explorer@gmail.com',
      username: 'sarahexplorer',
      firstName: 'Sarah',
      lastName: 'Johnson',
      password: hashedPassword,
      role: 'PREMIUM',
      isVerified: true,
      location: 'Denver, CO',
      country: 'USA',
      state: 'Colorado',
      city: 'Denver',
      timeZone: 'America/Denver',
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        create: {
          preferredActivities: ['photography', 'hiking', 'wildlife_watching'],
          difficultyLevel: 'MODERATE',
          accessibilityNeeds: [],
          enableAIRecommendations: true,
          enableVoiceFeatures: true,
          enableARFeatures: true,
          weatherAlerts: true,
          crowdAlerts: true
        }
      }
    }
  });

  const mike = await prisma.user.create({
    data: {
      email: 'mike.ranger@nps.gov',
      username: 'rangerMike',
      firstName: 'Michael',
      lastName: 'Thompson',
      password: hashedPassword,
      role: 'RANGER',
      isVerified: true,
      location: 'Yellowstone National Park, WY',
      country: 'USA',
      state: 'Wyoming',
      city: 'Yellowstone',
      timeZone: 'America/Denver',
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        create: {
          preferredActivities: ['education', 'conservation', 'safety'],
          difficultyLevel: 'EXPERT',
          emailNotifications: true,
          pushNotifications: true,
          shareLocation: false
        }
      }
    }
  });

  // 2. Create Parks
  console.log('🏞️ Creating National Parks...');
  const yellowstone = await prisma.park.create({
    data: {
      npsId: 'yell',
      name: 'Yellowstone National Park',
      slug: 'yellowstone',
      description: 'World\'s first national park featuring geysers, hot springs, and diverse wildlife.',
      shortDescription: 'America\'s first national park with geysers and wildlife.',
      state: 'Wyoming',
      latitude: 44.4280,
      longitude: -110.5885,
      elevation: 8000,
      area: 3472.0,
      timeZone: 'America/Denver',
      phone: '(307) 344-7381',
      website: 'https://www.nps.gov/yell',
      address: 'Yellowstone National Park, WY 82190',
      zipCode: '82190',
      activities: ['hiking', 'wildlife_watching', 'photography', 'camping'],
      amenities: ['visitor_center', 'parking', 'restrooms', 'lodging'],
      accessibility: ['wheelchair', 'audio_description'],
      entranceFees: {
        vehicle: 35,
        motorcycle: 30,
        individual: 20,
        annual: 70
      },
      featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800'
      ],
      operatingHours: {
        winter: '8:00 AM - 5:00 PM',
        summer: '24 hours'
      },
      seasonInfo: {
        best_time: 'April to October',
        peak_season: 'June to August'
      },
      visitorsPerYear: 4115000,
      peakSeason: 'Summer',
      crowdLevel: 'HIGH',
      weatherRating: 4.2,
      recommendationScore: 9.1
    }
  });

  const grandCanyon = await prisma.park.create({
    data: {
      npsId: 'grca',
      name: 'Grand Canyon National Park',
      slug: 'grand-canyon',
      description: 'Iconic canyon offering breathtaking views and hiking opportunities.',
      shortDescription: 'America\'s most famous canyon with stunning views.',
      state: 'Arizona',
      latitude: 36.1069,
      longitude: -112.1129,
      elevation: 7000,
      area: 1904.0,
      timeZone: 'America/Phoenix',
      phone: '(928) 638-7888',
      website: 'https://www.nps.gov/grca',
      address: 'Grand Canyon Village, AZ 86023',
      zipCode: '86023',
      activities: ['hiking', 'photography', 'stargazing'],
      amenities: ['visitor_center', 'parking', 'restrooms', 'shuttle'],
      accessibility: ['wheelchair', 'audio_tours'],
      entranceFees: {
        vehicle: 30,
        motorcycle: 25,
        individual: 15,
        annual: 60
      },
      featuredImage: 'https://images.unsplash.com/photo-1474645285409-9c4bbb44c4d8?w=800',
      images: [
        'https://images.unsplash.com/photo-1474645285409-9c4bbb44c4d8?w=800'
      ],
      operatingHours: {
        year_round: '24 hours (South Rim)'
      },
      seasonInfo: {
        best_time: 'March to May, September to November',
        peak_season: 'June to August'
      },
      visitorsPerYear: 5974411,
      peakSeason: 'Summer',
      crowdLevel: 'VERY_HIGH',
      weatherRating: 4.5,
      recommendationScore: 9.5
    }
  });

  // 3. Create a Sample Review
  console.log('📝 Creating Sample Review...');
  await prisma.review.create({
    data: {
      userId: sarah.id,
      parkId: yellowstone.id,
      title: 'Amazing Experience!',
      content: 'Yellowstone was incredible! The geysers and wildlife were amazing.',
      rating: 5,
      visitDate: new Date('2024-07-15'),
      accessibilityRating: 4,
      amenitiesRating: 5,
      sceneryRating: 5,
      crowdRating: 3,
      visitType: 'OVERNIGHT_CAMPING',
      groupSize: 2,
      visitDuration: 72,
      activities: ['hiking', 'wildlife_watching', 'photography'],
      bestTimeOfYear: ['june', 'july', 'august'],
      sentiment: 'VERY_POSITIVE',
      helpfulVotes: 24,
      unhelpfulVotes: 1
    }
  });

  // 4. Create Sample Weather Data
  console.log('🌤️ Creating Weather Data...');
  await prisma.weatherData.create({
    data: {
      parkId: yellowstone.id,
      temperature: 72.5,
      humidity: 45,
      windSpeed: 8.2,
      windDirection: 180,
      pressure: 30.1,
      visibility: 10.0,
      uvIndex: 6.5,
      condition: 'clear',
      description: 'Perfect weather for hiking',
      cloudCover: 15,
      precipitation: 0.0,
      recordedAt: new Date(),
      aiPrediction: {
        next_24h: 'favorable',
        confidence: 0.85,
        recommendations: ['great_for_hiking', 'good_visibility']
      },
      confidence: 0.92
    }
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n🔐 Test User Credentials:');
  console.log('Admin: krishna@trailverse.com / password123');
  console.log('User: sarah.explorer@gmail.com / password123');
  console.log('Ranger: mike.ranger@nps.gov / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
