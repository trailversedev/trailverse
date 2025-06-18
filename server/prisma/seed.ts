import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - remove in production)
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

  // 1. Create ML Models
  console.log('🤖 Creating ML Models...');
  const mlModels = await Promise.all([
    prisma.mLModel.create({
      data: {
        name: 'park-recommendation-v1',
        version: '1.0.0',
        type: 'RECOMMENDATION',
        description: 'Collaborative filtering model for park recommendations',
        config: {
          algorithm: 'collaborative_filtering',
          features: ['user_preferences', 'historical_visits', 'ratings'],
          model_size: 'medium'
        },
        metrics: {
          accuracy: 0.87,
          precision: 0.82,
          recall: 0.79,
          f1_score: 0.80
        },
        isActive: true,
        accuracy: 0.87,
        latency: 45,
        throughput: 150.0,
        lastTrainedAt: new Date(),
        deployedAt: new Date()
      }
    }),
    prisma.mLModel.create({
      data: {
        name: 'crowd-prediction-v2',
        version: '2.1.0',
        type: 'PREDICTION',
        description: 'Time series model for predicting park crowd levels',
        config: {
          algorithm: 'lstm',
          features: ['historical_crowds', 'weather', 'events', 'seasonality'],
          prediction_horizon: '24h'
        },
        metrics: {
          mae: 0.15,
          rmse: 0.22,
          mape: 12.5
        },
        isActive: true,
        accuracy: 0.85,
        latency: 120,
        throughput: 80.0,
        lastTrainedAt: new Date(),
        deployedAt: new Date()
      }
    }),
    prisma.mLModel.create({
      data: {
        name: 'sentiment-analysis-v1',
        version: '1.2.0',
        type: 'NLP',
        description: 'BERT-based model for review sentiment analysis',
        config: {
          base_model: 'bert-base-uncased',
          max_length: 512,
          num_classes: 5
        },
        metrics: {
          accuracy: 0.91,
          precision: 0.89,
          recall: 0.88
        },
        isActive: true,
        accuracy: 0.91,
        latency: 200,
        throughput: 50.0,
        lastTrainedAt: new Date(),
        deployedAt: new Date()
      }
    })
  ]);

  // 2. Create Achievements
  console.log('🏆 Creating Achievements...');
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: 'First Steps',
        description: 'Visit your first national park',
        icon: '👶',
        category: 'EXPLORATION',
        difficulty: 'EASY',
        points: 100,
        requirements: {
          parks_visited: 1
        }
      }
    }),
    prisma.achievement.create({
      data: {
        name: 'Explorer',
        description: 'Visit 10 different national parks',
        icon: '🧭',
        category: 'EXPLORATION',
        difficulty: 'MODERATE',
        points: 500,
        requirements: {
          parks_visited: 10
        }
      }
    }),
    prisma.achievement.create({
      data: {
        name: 'Trail Master',
        description: 'Complete 50 miles of hiking trails',
        icon: '🥾',
        category: 'HIKING',
        difficulty: 'HARD',
        points: 1000,
        requirements: {
          total_hiking_distance: 50
        }
      }
    }),
    prisma.achievement.create({
      data: {
        name: 'Photographer',
        description: 'Share 25 photos in photo contests',
        icon: '📸',
        category: 'PHOTOGRAPHY',
        difficulty: 'MODERATE',
        points: 300,
        requirements: {
          photos_shared: 25
        }
      }
    }),
    prisma.achievement.create({
      data: {
        name: 'Social Butterfly',
        description: 'Connect with 20 fellow park enthusiasts',
        icon: '🦋',
        category: 'SOCIAL',
        difficulty: 'MODERATE',
        points: 400,
        requirements: {
          social_connections: 20
        }
      }
    }),
    prisma.achievement.create({
      data: {
        name: 'Conservation Champion',
        description: 'Report 10 conservation issues or wildlife sightings',
        icon: '🌱',
        category: 'CONSERVATION',
        difficulty: 'MODERATE',
        points: 600,
        requirements: {
          conservation_reports: 10
        }
      }
    })
  ]);

  // 3. Create Sample Users
  console.log('👤 Creating Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'krishna@trailverse.com',
        username: 'krishnasathvik',
        firstName: 'Krishna',
        lastName: 'Sathvik',
        password: hashedPassword,
        avatar: 'https://avatars.githubusercontent.com/u/1234567?v=4',
        bio: 'Founder of Trailverse. Passionate about national parks and technology.',
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
            preferredActivities: ['hiking', 'photography', 'camping', 'rock_climbing'],
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
    }),
    prisma.user.create({
      data: {
        email: 'sarah.explorer@gmail.com',
        username: 'sarahexplorer',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150',
        bio: 'Adventure photographer and nature lover. Always seeking the next great trail!',
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
    }),
    prisma.user.create({
      data: {
        email: 'mike.ranger@nps.gov',
        username: 'rangerMike',
        firstName: 'Michael',
        lastName: 'Thompson',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'National Park Ranger at Yellowstone. Here to help visitors have safe and memorable experiences.',
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
    }),
    prisma.user.create({
      data: {
        email: 'alex.family@yahoo.com',
        username: 'alexfamily',
        firstName: 'Alex',
        lastName: 'Chen',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'Father of two, love taking family trips to national parks. Accessibility advocate.',
        role: 'USER',
        isVerified: true,
        location: 'Austin, TX',
        country: 'USA',
        state: 'Texas',
        city: 'Austin',
        timeZone: 'America/Chicago',
        emailVerifiedAt: new Date(),
        preferences: {
          create: {
            preferredActivities: ['family_friendly', 'easy_trails', 'visitor_centers'],
            difficultyLevel: 'EASY',
            accessibilityNeeds: ['wheelchair', 'stroller_friendly'],
            enableAIRecommendations: true,
            weeklyDigest: true,
            weatherAlerts: true
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'emily.backpacker@gmail.com',
        username: 'emilybackpacker',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        bio: 'Solo backpacker and minimalist traveler. Love remote wilderness areas.',
        role: 'USER',
        isVerified: true,
        location: 'Seattle, WA',
        country: 'USA',
        state: 'Washington',
        city: 'Seattle',
        timeZone: 'America/Los_Angeles',
        emailVerifiedAt: new Date(),
        preferences: {
          create: {
            preferredActivities: ['backpacking', 'wilderness', 'solitude'],
            difficultyLevel: 'EXPERT',
            accessibilityNeeds: [],
            enableAIRecommendations: true,
            enableVoiceFeatures: false,
            shareLocation: false,
            allowDataCollection: false
          }
        }
      }
    })
  ]);

  // 4. Create National Parks
  console.log('🏞️ Creating National Parks...');
  const parks = await Promise.all([
    prisma.park.create({
      data: {
        npsId: 'yell',
        name: 'Yellowstone National Park',
        slug: 'yellowstone',
        description: 'Yellowstone National Park is a nearly 3,500-sq.-mile wilderness recreation area atop a volcanic hotspot. Mostly in Wyoming, the park spreads into parts of Montana and Idaho too. Yellowstone features dramatic canyons, alpine rivers, lush forests, hot springs and gushing geysers – including its most famous, Old Faithful.',
        shortDescription: 'World\'s first national park featuring geysers, hot springs, and diverse wildlife.',
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
        activities: ['hiking', 'wildlife_watching', 'photography', 'camping', 'fishing', 'hot_springs'],
        amenities: ['visitor_center', 'parking', 'restrooms', 'lodging', 'dining', 'gift_shop'],
        accessibility: ['wheelchair', 'audio_description', 'braille'],
        entranceFees: {
          vehicle: 35,
          motorcycle: 30,
          individual: 20,
          annual: 70
        },
        featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800',
          'https://images.unsplash.com/photo-1570394392772-6ffca6ceaf43?w=800'
        ],
        operatingHours: {
          winter: '8:00 AM - 5:00 PM',
          summer: '24 hours',
          spring: '8:00 AM - 8:00 PM',
          fall: '8:00 AM - 6:00 PM'
        },
        seasonInfo: {
          best_time: 'April to October',
          peak_season: 'June to August',
          road_closures: 'November to April (some roads)'
        },
        visitorsPerYear: 4115000,
        peakSeason: 'Summer',
        crowdLevel: 'HIGH',
        weatherRating: 4.2,
        recommendationScore: 9.1
      }
    }),
    prisma.park.create({
      data: {
        npsId: 'grca',
        name: 'Grand Canyon National Park',
        slug: 'grand-canyon',
        description: 'The Grand Canyon is a steep-sided canyon carved by the Colorado River in Arizona. The Grand Canyon is 277 miles long, up to 18 miles wide and more than a mile deep. The canyon and adjacent rim are contained within Grand Canyon National Park.',
        shortDescription: 'Iconic canyon offering breathtaking views and hiking opportunities.',
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
        activities: ['hiking', 'mule_rides', 'rafting', 'photography', 'stargazing'],
        amenities: ['visitor_center', 'parking', 'restrooms', 'lodging', 'dining', 'shuttle'],
        accessibility: ['wheelchair', 'audio_tours', 'large_print'],
        entranceFees: {
          vehicle: 30,
          motorcycle: 25,
          individual: 15,
          annual: 60
        },
        featuredImage: 'https://images.unsplash.com/photo-1474645285409-9c4bbb44c4d8?w=800',
        images: [
          'https://images.unsplash.com/photo-1474645285409-9c4bbb44c4d8?w=800',
          'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800',
          'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800'
        ],
        operatingHours: {
          year_round: '24 hours (South Rim)',
          north_rim: 'May 15 - October 15'
        },
        seasonInfo: {
          best_time: 'March to May, September to November',
          peak_season: 'June to August',
          weather_note: 'Temperature varies greatly by elevation'
        },
        visitorsPerYear: 5974411,
        peakSeason: 'Summer',
        crowdLevel: 'VERY_HIGH',
        weatherRating: 4.5,
        recommendationScore: 9.5
      }
    }),
    prisma.park.create({
      data: {
        npsId: 'yose',
        name: 'Yosemite National Park',
        slug: 'yosemite',
        description: 'Yosemite National Park is in California\'s Sierra Nevada mountains. It\'s famed for its giant, ancient sequoia trees, and for Tunnel View, the iconic vista of towering Bridalveil Fall and the granite cliffs of El Capitan and Half Dome.',
        shortDescription: 'Granite cliffs, waterfalls, and giant sequoias in the Sierra Nevada.',
        state: 'California',
        latitude: 37.8651,
        longitude: -119.5383,
        elevation: 4000,
        area: 1168.0,
        timeZone: 'America/Los_Angeles',
        phone: '(209) 372-0200',
        website: 'https://www.nps.gov/yose',
        address: 'Yosemite National Park, CA 95389',
        zipCode: '95389',
        activities: ['rock_climbing', 'hiking', 'photography', 'camping', 'waterfalls'],
        amenities: ['visitor_center', 'parking', 'restrooms', 'lodging', 'dining', 'shuttle'],
        accessibility: ['wheelchair', 'audio_tours', 'sign_language'],
        entranceFees: {
          vehicle: 35,
          motorcycle: 30,
          individual: 20,
          annual: 70
        },
        featuredImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        images: [
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1558652899-b4bb12b3f103?w=800'
        ],
        operatingHours: {
          year_round: '24 hours',
          note: 'Some roads close in winter'
        },
        seasonInfo: {
          best_time: 'April to October',
          peak_season: 'May to September',
          waterfalls_peak: 'April to June'
        },
        visitorsPerYear: 4336890,
        peakSeason: 'Summer',
        crowdLevel: 'VERY_HIGH',
        weatherRating: 4.4,
        recommendationScore: 9.3
      }
    }),
    prisma.park.create({
      data: {
        npsId: 'zion',
        name: 'Zion National Park',
        slug: 'zion',
        description: 'Zion National Park is a southwest Utah desert park with dramatic red cliffs. The main area is Zion Canyon, with the Virgin River running through. Other notable areas include the Emerald Pools, with waterfalls and a hanging garden.',
        shortDescription: 'Red rock canyons and the famous Narrows hike in Utah.',
        state: 'Utah',
        latitude: 37.2982,
        longitude: -113.0263,
        elevation: 4000,
        area: 229.0,
        timeZone: 'America/Denver',
        phone: '(435) 772-3256',
        website: 'https://www.nps.gov/zion',
        address: 'Springdale, UT 84767',
        zipCode: '84767',
        activities: ['hiking', 'canyoneering', 'rock_climbing', 'photography', 'river_walking'],
        amenities: ['visitor_center', 'parking', 'restrooms', 'shuttle', 'dining'],
        accessibility: ['wheelchair', 'audio_tours'],
        entranceFees: {
          vehicle: 30,
          motorcycle: 25,
          individual: 15,
          annual: 60
        },
        featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800'
        ],
        operatingHours: {
          year_round: '24 hours',
          shuttle: 'Seasonal operation'
        },
        seasonInfo: {
          best_time: 'March to November',
          peak_season: 'April to October',
          flash_flood_season: 'July to September'
        },
        visitorsPerYear: 4488268,
        peakSeason: 'Spring/Fall',
        crowdLevel: 'VERY_HIGH',
        weatherRating: 4.3,
        recommendationScore: 9.0
      }
    }),
    prisma.park.create({
      data: {
        npsId: 'gsmnp',
        name: 'Great Smoky Mountains National Park',
        slug: 'great-smoky-mountains',
        description: 'Great Smoky Mountains National Park straddles the border of North Carolina and Tennessee. The sprawling landscape encompasses lush forests and an abundance of wildflowers that bloom year-round.',
        shortDescription: 'Ancient mountains with diverse wildlife and stunning fall colors.',
        state: 'Tennessee',
        latitude: 35.6118,
        longitude: -83.4895,
        elevation: 2000,
        area: 816.0,
        timeZone: 'America/New_York',
        phone: '(865) 436-1200',
        website: 'https://www.nps.gov/grsm',
        address: 'Gatlinburg, TN 37738',
        zipCode: '37738',
        activities: ['hiking', 'wildlife_watching', 'photography', 'fishing', 'historic_buildings'],
        amenities: ['visitor_center', 'parking', 'restrooms', 'camping'],
        accessibility: ['wheelchair', 'audio_tours'],
        entranceFees: {
          note: 'No entrance fee required'
        },
        featuredImage: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800',
        images: [
          'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800',
          'https://images.unsplash.com/photo-1570394392772-6ffca6ceaf43?w=800'
        ],
        operatingHours: {
          year_round: '24 hours'
        },
        seasonInfo: {
          best_time: 'April to October',
          peak_season: 'June to August, October (fall colors)',
          fall_colors: 'Mid-September to early November'
        },
        visitorsPerYear: 12547743,
        peakSeason: 'Summer/Fall',
        crowdLevel: 'VERY_HIGH',
        weatherRating: 4.1,
        recommendationScore: 8.8
      }
    })
  ]);

  // 5. Create Trails for each park
  console.log('🥾 Creating Trails...');
  const trails = [];

  // Yellowstone Trails
  trails.push(
    ...(await Promise.all([
      prisma.trail.create({
        data: {
          parkId: parks[0].id,
          name: 'Old Faithful Observation Point',
          description: 'Moderate hike offering elevated views of Old Faithful geyser.',
          difficulty: 'MODERATE',
          length: 2.1,
          elevationGain: 200,
          estimatedTime: 90,
          trailType: 'OUT_AND_BACK',
          startLatitude: 44.4605,
          startLongitude: -110.8281,
          features: ['geyser_views', 'photography', 'interpretive_signs'],
          accessibility: [],
          seasonality: ['april', 'may', 'june', 'july', 'august', 'september', 'october'],
          condition: 'GOOD',
          images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800']
        }
      }),
      prisma.trail.create({
        data: {
          parkId: parks[0].id,
          name: 'Grand Prismatic Hot Spring Overlook',
          description: 'Short hike to an overlook of the famous Grand Prismatic Spring.',
          difficulty: 'EASY',
          length: 1.6,
          elevationGain: 105,
          estimatedTime: 60,
          trailType: 'OUT_AND_BACK',
          features: ['hot_springs', 'photography', 'colorful_pools'],
          accessibility: [],
          seasonality: ['may', 'june', 'july', 'august', 'september'],
          condition: 'EXCELLENT'
        }
      })
    ]))
  );

  // Grand Canyon Trails
  trails.push(
    ...(await Promise.all([
      prisma.trail.create({
        data: {
          parkId: parks[1].id,
          name: 'South Rim Trail',
          description: 'Paved trail along the South Rim with spectacular canyon views.',
          difficulty: 'EASY',
          length: 13.0,
          elevationGain: 200,
          estimatedTime: 480,
          trailType: 'POINT_TO_POINT',
          features: ['canyon_views', 'photography', 'visitor_centers', 'shuttle_stops'],
          accessibility: ['wheelchair', 'paved'],
          seasonality: ['year_round'],
          condition: 'EXCELLENT'
        }
      }),
      prisma.trail.create({
        data: {
          parkId: parks[1].id,
          name: 'Bright Angel Trail',
          description: 'Historic trail descending into the Grand Canyon.',
          difficulty: 'HARD',
          length: 19.1,
          elevationGain: 4380,
          estimatedTime: 720,
          trailType: 'OUT_AND_BACK',
          features: ['inner_canyon', 'colorado_river', 'rest_houses', 'water_stations'],
          accessibility: [],
          seasonality: ['year_round'],
          condition: 'GOOD'
        }
      })
    ]))
  );

  // 6. Create Sample Reviews
  console.log('📝 Creating Reviews...');
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: users[1].id, // Sarah
        parkId: parks[0].id, // Yellowstone
        title: 'Absolutely Magical Experience!',
        content: 'Yellowstone exceeded all my expectations. Old Faithful was incredible, and we saw so much wildlife including bison, elk, and even a grizzly bear from a safe distance. The Grand Prismatic Spring is a must-see - the colors are otherworldly! Best time to visit is early morning for fewer crowds.',
        rating: 5,
        visitDate: new Date('2024-07-15'),
        accessibilityRating: 4,
        amenitiesRating: 5,
        sceneryRating: 5,
        crowdRating: 3,
        visitType: 'OVERNIGHT_CAMPING',
        groupSize: 2,
        visitDuration: 72,
        activities: ['hiking', 'wildlife_watching', 'photography', 'camping'],
        bestTimeOfYear: ['june', 'july', 'august'],
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800'
        ],
        sentiment: 'VERY_POSITIVE',
        helpfulVotes: 24,
        unhelpfulVotes: 1
      }
    }),
    prisma.review.create({
      data: {
        userId: users[3].id, // Alex (family)
        parkId: parks[1].id, // Grand Canyon
        title: 'Perfect Family Destination',
        content: 'Took our kids (ages 8 and 12) to the Grand Canyon and it was perfect for families. The South Rim Trail is mostly accessible and offers amazing views. Kids loved the Junior Ranger program. Visitor center has great exhibits. Only downside was the crowds during peak hours.',
        rating: 4,
        visitDate: new Date('2024-06-20'),
        accessibilityRating: 5,
        amenitiesRating: 4,
        sceneryRating: 5,
        crowdRating: 2,
        visitType: 'DAY_TRIP',
        groupSize: 4,
        visitDuration: 8,
        activities: ['hiking', 'visitor_center', 'photography', 'junior_ranger'],
        bestTimeOfYear: ['spring', 'fall'],
        sentiment: 'POSITIVE',
        helpfulVotes: 18,
        unhelpfulVotes: 2
      }
    }),
    prisma.review.create({
      data: {
        userId: users[4].id, // Emily (backpacker)
        parkId: parks[2].id, // Yosemite
        title: 'Backpacker\'s Paradise',
        content: 'Spent 5 days backpacking in Yosemite wilderness. Half Dome permit hike was challenging but absolutely worth it. Valley can get crowded, but once you get into the backcountry, it\'s pure solitude and stunning scenery. Water sources were reliable in May. Highly recommend for experienced hikers.',
        rating: 5,
        visitDate: new Date('2024-05-10'),
        accessibilityRating: 2,
        amenitiesRating: 3,
        sceneryRating: 5,
        crowdRating: 4,
        visitType: 'BACKPACKING',
        groupSize: 1,
        visitDuration: 120,
        activities: ['backpacking', 'rock_climbing', 'photography', 'wilderness'],
        bestTimeOfYear: ['may', 'june', 'september'],
        sentiment: 'VERY_POSITIVE',
        helpfulVotes: 31,
        unhelpfulVotes: 0
      }
    })
  ]);

  // 7. Create Sample Trips
  console.log('🗺️ Creating Sample Trips...');
  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        userId: users[1].id, // Sarah
        name: 'Southwest National Parks Adventure',
        description: 'Epic road trip covering the major national parks of the Southwest',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2024-09-25'),
        totalDays: 10,
        totalDistance: 1250.5,
        estimatedCost: 2500.00,
        isPublic: true,
        allowCollaboration: true,
        status: 'PLANNING',
        stops: {
          create: [
            {
              parkId: parks[1].id, // Grand Canyon
              order: 1,
              arrivalDate: new Date('2024-09-15'),
              departureDate: new Date('2024-09-17'),
              duration: 48,
              activities: ['hiking', 'photography', 'sunrise_viewing'],
              notes: 'Focus on South Rim, book sunrise viewing spot',
              estimatedCost: 400.00
            },
            {
              parkId: parks[3].id, // Zion
              order: 2,
              arrivalDate: new Date('2024-09-18'),
              departureDate: new Date('2024-09-21'),
              duration: 72,
              activities: ['hiking', 'canyoneering', 'narrows'],
              notes: 'Need permits for Angels Landing and Narrows',
              estimatedCost: 600.00
            },
            {
              parkId: parks[2].id, // Yosemite
              order: 3,
              arrivalDate: new Date('2024-09-22'),
              departureDate: new Date('2024-09-25'),
              duration: 72,
              activities: ['hiking', 'rock_climbing', 'waterfalls'],
              notes: 'End trip with Yosemite Valley exploration',
              estimatedCost: 500.00
            }
          ]
        }
      }
    }),
    prisma.trip.create({
      data: {
        userId: users[3].id, // Alex (family)
        name: 'Family-Friendly National Parks',
        description: 'Accessible parks perfect for families with young children',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-07'),
        totalDays: 7,
        totalDistance: 850.0,
        estimatedCost: 1800.00,
        isPublic: true,
        status: 'CONFIRMED',
        stops: {
          create: [
            {
              parkId: parks[4].id, // Great Smoky Mountains
              order: 1,
              arrivalDate: new Date('2024-08-01'),
              departureDate: new Date('2024-08-04'),
              duration: 72,
              activities: ['easy_trails', 'visitor_center', 'wildlife_watching'],
              notes: 'Focus on accessible trails and visitor programs',
              estimatedCost: 600.00
            },
            {
              parkId: parks[1].id, // Grand Canyon
              order: 2,
              arrivalDate: new Date('2024-08-05'),
              departureDate: new Date('2024-08-07'),
              duration: 48,
              activities: ['rim_trail', 'junior_ranger', 'imax_theater'],
              notes: 'Stay on South Rim, kids love the IMAX experience',
              estimatedCost: 500.00
            }
          ]
        }
      }
    })
  ]);

  // 8. Create Favorites
  console.log('⭐ Creating Favorites...');
  await Promise.all([
    prisma.favorite.create({
      data: {
        userId: users[1].id,
        parkId: parks[0].id,
        category: 'VISITED',
        notes: 'Amazing wildlife photography opportunities'
      }
    }),
    prisma.favorite.create({
      data: {
        userId: users[1].id,
        parkId: parks[2].id,
        category: 'WISHLIST',
        notes: 'Want to photograph Half Dome at sunrise'
      }
    }),
    prisma.favorite.create({
      data: {
        userId: users[3].id,
        parkId: parks[1].id,
        category: 'VISITED',
        notes: 'Kids had a blast with Junior Ranger program'
      }
    }),
    prisma.favorite.create({
      data: {
        userId: users[4].id,
        parkId: parks[2].id,
        category: 'BUCKET_LIST',
        notes: 'Half Dome cables - the ultimate challenge'
      }
    })
  ]);

  // 9. Create Social Connections
  console.log('👥 Creating Social Connections...');
  await Promise.all([
    prisma.socialConnection.create({
      data: {
        userId: users[1].id,
        connectedUserId: users[3].id,
        status: 'ACCEPTED',
        connectionType: 'FRIEND'
      }
    }),
    prisma.socialConnection.create({
      data: {
        userId: users[1].id,
        connectedUserId: users[4].id,
        status: 'ACCEPTED',
        connectionType: 'FRIEND'
      }
    }),
    prisma.socialConnection.create({
      data: {
        userId: users[3].id,
        connectedUserId: users[4].id,
        status: 'PENDING',
        connectionType: 'FRIEND'
      }
    })
  ]);

  // 10. Create User Achievements
  console.log('🏆 Creating User Achievements...');
  await Promise.all([
    prisma.userAchievement.create({
      data: {
        userId: users[1].id,
        achievementId: achievements[0].id, // First Steps
        progress: 100,
        isCompleted: true,
        completedAt: new Date('2024-07-15')
      }
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[1].id,
        achievementId: achievements[3].id, // Photographer
        progress: 80,
        isCompleted: false
      }
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[3].id,
        achievementId: achievements[0].id, // First Steps
        progress: 100,
        isCompleted: true,
        completedAt: new Date('2024-06-20')
      }
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[4].id,
        achievementId: achievements[1].id, // Explorer
        progress: 30,
        isCompleted: false
      }
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[4].id,
        achievementId: achievements[2].id, // Trail Master
        progress: 60,
        isCompleted: false
      }
    })
  ]);

  // 11. Create Weather Data
  console.log('🌤️ Creating Weather Data...');
  const weatherData = [];
  for (const park of parks) {
    // Current weather
    weatherData.push(
      prisma.weatherData.create({
        data: {
          parkId: park.id,
          temperature: Math.random() * 30 + 50, // 50-80°F
          humidity: Math.floor(Math.random() * 40 + 30), // 30-70%
          windSpeed: Math.random() * 15 + 5, // 5-20 mph
          windDirection: Math.floor(Math.random() * 360),
          pressure: Math.random() * 2 + 29, // 29-31 inHg
          visibility: Math.random() * 5 + 5, // 5-10 miles
          uvIndex: Math.random() * 8 + 2, // 2-10
          condition: ['clear', 'partly_cloudy', 'cloudy', 'overcast'][Math.floor(Math.random() * 4)],
          description: 'Pleasant conditions for outdoor activities',
          cloudCover: Math.floor(Math.random() * 100),
          precipitation: Math.random() * 0.1,
          recordedAt: new Date(),
          aiPrediction: {
            next_24h: 'favorable',
            confidence: 0.85,
            recommendations: ['great_for_hiking', 'good_visibility']
          },
          confidence: 0.92
        }
      })
    );

    // Forecast data (next 3 days)
    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      weatherData.push(
        prisma.weatherData.create({
          data: {
            parkId: park.id,
            temperature: Math.random() * 25 + 45 + (i * 2), // Slight temp variation
            humidity: Math.floor(Math.random() * 50 + 25),
            windSpeed: Math.random() * 20 + 3,
            condition: ['clear', 'partly_cloudy', 'cloudy', 'light_rain'][Math.floor(Math.random() * 4)],
            description: `Day ${i} forecast`,
            recordedAt: new Date(),
            forecastDate: forecastDate,
            aiPrediction: {
              confidence: 0.75 - (i * 0.1),
              conditions: 'moderate'
            },
            confidence: 0.80 - (i * 0.1)
          }
        })
      );
    }
  }
  await Promise.all(weatherData);

  // 12. Create Crowd Data
  console.log('👥 Creating Crowd Data...');
  const crowdData = [];
  for (const park of parks) {
    const currentHour = new Date().getHours();
    let crowdLevel: any = 'MODERATE';

    // Simulate realistic crowd patterns
    if (currentHour >= 10 && currentHour <= 16) {
      crowdLevel = ['HIGH', 'VERY_HIGH'][Math.floor(Math.random() * 2)];
    } else if (currentHour >= 6 && currentHour <= 9) {
      crowdLevel = 'MODERATE';
    } else {
      crowdLevel = 'LOW';
    }

    crowdData.push(
      prisma.crowdData.create({
        data: {
          parkId: park.id,
          crowdLevel: crowdLevel,
          capacity: Math.floor(Math.random() * 40 + 60), // 60-100% capacity
          waitTime: Math.floor(Math.random() * 30), // 0-30 minutes
          parkingSpaces: Math.floor(Math.random() * 200 + 50), // 50-250 spaces
          area: 'visitor_center',
          source: 'SENSOR_DATA',
          confidence: 0.88,
          recordedAt: new Date(),
          validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) // Valid for 2 hours
        }
      })
    );

    // Additional crowd data for different areas
    crowdData.push(
      prisma.crowdData.create({
        data: {
          parkId: park.id,
          crowdLevel: 'MODERATE',
          capacity: Math.floor(Math.random() * 30 + 40),
          area: 'main_trails',
          source: 'USER_REPORT',
          confidence: 0.75,
          recordedAt: new Date(),
          validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000)
        }
      })
    );
  }
  await Promise.all(crowdData);

  // 13. Create Live Updates
  console.log('📱 Creating Live Updates...');
  await Promise.all([
    prisma.liveUpdate.create({
      data: {
        userId: users[2].id, // Ranger Mike
        parkId: parks[0].id, // Yellowstone
        type: 'WILDLIFE_SIGHTING',
        title: 'Grizzly Bear Sighting Alert',
        content: 'Grizzly bear spotted near Hayden Valley this morning. Please maintain 100-yard distance and make noise while hiking. Bear spray recommended.',
        location: 'Hayden Valley',
        severity: 'WARNING',
        tags: ['wildlife', 'safety', 'grizzly'],
        isVerified: true,
        verifiedBy: 'Ranger Mike Thompson',
        upvotes: 15,
        downvotes: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        images: ['https://images.unsplash.com/photo-1570394392772-6ffca6ceaf43?w=400']
      }
    }),
    prisma.liveUpdate.create({
      data: {
        userId: users[1].id, // Sarah
        parkId: parks[1].id, // Grand Canyon
        type: 'PARKING_STATUS',
        title: 'South Rim Parking Nearly Full',
        content: 'Parking lots at South Rim visitor center are 95% full. Consider using shuttle service or arrive before 8 AM tomorrow.',
        location: 'South Rim Visitor Center',
        severity: 'INFO',
        tags: ['parking', 'transportation'],
        isVerified: false,
        upvotes: 8,
        downvotes: 1,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
      }
    }),
    prisma.liveUpdate.create({
      data: {
        userId: users[4].id, // Emily
        parkId: parks[2].id, // Yosemite
        type: 'TRAIL_CONDITION',
        title: 'Half Dome Cables in Great Condition',
        content: 'Just completed Half Dome hike. Cables are up and in excellent condition. Weather was perfect. Started at 4 AM, finished by 2 PM. Highly recommend!',
        location: 'Half Dome Summit',
        severity: 'INFO',
        tags: ['hiking', 'half_dome', 'cables', 'conditions'],
        isVerified: false,
        upvotes: 22,
        downvotes: 0,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400']
      }
    })
  ]);

  // 14. Create Photo Contest Entries
  console.log('📸 Creating Photo Contest Entries...');
  await Promise.all([
    prisma.photoContestEntry.create({
      data: {
        userId: users[1].id, // Sarah
        parkId: parks[0].id, // Yellowstone
        title: 'Golden Hour at Grand Prismatic',
        description: 'Captured this stunning shot of Grand Prismatic Spring during golden hour. The colors were absolutely incredible!',
        imageUrl: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800',
        category: 'LANDSCAPE',
        contestMonth: '2024-07',
        isWinner: true,
        votes: 156,
        location: 'Grand Prismatic Spring',
        captureDate: new Date('2024-07-15'),
        cameraSettings: {
          camera: 'Canon EOS R5',
          lens: '24-70mm f/2.8',
          aperture: 'f/8',
          shutter: '1/250s',
          iso: 200
        }
      }
    }),
    prisma.photoContestEntry.create({
      data: {
        userId: users[4].id, // Emily
        parkId: parks[2].id, // Yosemite
        title: 'Solitude on Half Dome',
        description: 'Early morning summit of Half Dome before the crowds arrived. The sense of accomplishment and peace was indescribable.',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        category: 'ADVENTURE',
        contestMonth: '2024-06',
        isWinner: false,
        votes: 89,
        location: 'Half Dome Summit',
        captureDate: new Date('2024-05-10')
      }
    }),
    prisma.photoContestEntry.create({
      data: {
        userId: users[3].id, // Alex
        parkId: parks[1].id, // Grand Canyon
        title: 'Family Adventure at the Rim',
        description: 'My kids experiencing the Grand Canyon for the first time. Their expressions of wonder say it all!',
        imageUrl: 'https://images.unsplash.com/photo-1474645285409-9c4bbb44c4d8?w=800',
        category: 'PEOPLE',
        contestMonth: '2024-06',
        isWinner: false,
        votes: 67,
        location: 'South Rim',
        captureDate: new Date('2024-06-20')
      }
    })
  ]);

  // 15. Create Ranger Chats
  console.log('💬 Creating Ranger Chats...');
  await Promise.all([
    prisma.rangerChat.create({
      data: {
        userId: users[1].id, // Sarah
        question: 'What\'s the best time to photograph Old Faithful with minimal crowds?',
        response: 'For photography with fewer crowds, I recommend arriving at Old Faithful before 8 AM or after 6 PM. The lighting is also beautiful during these times. Early morning often has the added bonus of wildlife activity nearby!',
        category: 'GENERAL_INFO',
        status: 'RESPONDED',
        priority: 'NORMAL',
        rangerId: users[2].id, // Ranger Mike
        assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        respondedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        isHelpful: true,
        rating: 5
      }
    }),
    prisma.rangerChat.create({
      data: {
        userId: users[3].id, // Alex
        question: 'Are there any wheelchair accessible trails at Yellowstone that my elderly father could enjoy?',
        response: 'Absolutely! The boardwalks around Old Faithful, Grand Prismatic Spring, and most of the Upper Geyser Basin are fully wheelchair accessible. The Fountain Paint Pot trail is also accessible. All have fascinating geothermal features and are perfect for visitors with mobility needs.',
        category: 'ACCESSIBILITY',
        status: 'RESPONDED',
        priority: 'NORMAL',
        rangerId: users[2].id, // Ranger Mike
        assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isHelpful: true,
        rating: 5
      }
    }),
    prisma.rangerChat.create({
      data: {
        userId: users[4].id, // Emily
        question: 'I\'m planning a solo backpacking trip in the Yellowstone backcountry. What permits do I need and what are the current bear activity levels?',
        category: 'PERMITS',
        status: 'ASSIGNED',
        priority: 'HIGH',
        rangerId: users[2].id, // Ranger Mike
        assignedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    })
  ]);

  // 16. Create Notifications
  console.log('🔔 Creating Notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[1].id, // Sarah
        title: 'Weather Alert: Yellowstone',
        message: 'Thunderstorms expected in Yellowstone National Park this afternoon. Consider indoor activities or carry rain gear.',
        type: 'WARNING',
        category: 'WEATHER_ALERT',
        actionUrl: '/parks/yellowstone/weather',
        actionText: 'View Weather Details',
        data: {
          parkId: parks[0].id,
          severity: 'moderate',
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        channels: ['push', 'email'],
        sentAt: new Date(),
        deliveredAt: new Date(),
        scheduledFor: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }),
    prisma.notification.create({
      data: {
        userId: users[3].id, // Alex
        title: 'Trip Reminder: Grand Canyon Adventure',
        message: 'Your trip to Grand Canyon National Park starts in 3 days! Don\'t forget to pack sunscreen and plenty of water.',
        type: 'REMINDER',
        category: 'TRIP_REMINDER',
        actionUrl: '/trips/grand-canyon-adventure',
        actionText: 'View Trip Details',
        data: {
          tripId: trips[1].id,
          daysUntilTrip: 3
        },
        channels: ['push', 'email'],
        sentAt: new Date(),
        deliveredAt: new Date(),
        isRead: false
      }
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id, // Sarah
        title: 'Achievement Unlocked: Photographer!',
        message: 'Congratulations! You\'ve shared 20 photos and earned the Photographer achievement. Keep capturing those amazing moments!',
        type: 'SUCCESS',
        category: 'ACHIEVEMENT',
        actionUrl: '/profile/achievements',
        actionText: 'View Achievements',
        data: {
          achievementId: achievements[3].id,
          pointsEarned: 300
        },
        channels: ['push'],
        sentAt: new Date(),
        deliveredAt: new Date(),
        isRead: true,
        readAt: new Date()
      }
    })
  ]);

  // 17. Create Analytics Events
  console.log('📊 Creating Analytics Events...');
  const analyticsEvents = [];

  // Create various event types for different users
  const eventTypes = ['PAGE_VIEW', 'CLICK', 'SEARCH', 'PARK_VIEW', 'TRIP_CREATE', 'REVIEW_CREATE', 'FAVORITE_ADD'];
  const pages = ['home', 'parks', 'trip-planner', 'profile', 'search'];

  for (let i = 0; i < 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomPage = pages[Math.floor(Math.random() * pages.length)];

    analyticsEvents.push(
      prisma.analyticsEvent.create({
        data: {
          userId: randomUser.id,
          eventName: `${randomEventType.toLowerCase()}_${randomPage}`,
          eventType: randomEventType as any,
          category: 'user_interaction',
          properties: {
            page: randomPage,
            referrer: 'https://google.com',
            device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
            browser: ['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)],
            session_duration: Math.floor(Math.random() * 1800 + 300) // 5-35 minutes
          },
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (compatible; TrailverseBot/1.0)',
          country: 'USA',
          region: ['CA', 'NY', 'TX', 'FL', 'WA'][Math.floor(Math.random() * 5)],
          city: ['San Francisco', 'New York', 'Austin', 'Miami', 'Seattle'][Math.floor(Math.random() * 5)],
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
          serverTimestamp: new Date()
        }
      })
    );
  }

  await Promise.all(analyticsEvents);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Seeding Summary:');
  console.log(`👤 Users: ${users.length}`);
  console.log(`🏞️ Parks: ${parks.length}`);
  console.log(`🥾 Trails: ${trails.length}`);
  console.log(`📝 Reviews: ${reviews.length}`);
  console.log(`🗺️ Trips: ${trips.length}`);
  console.log(`🏆 Achievements: ${achievements.length}`);
  console.log(`🤖 ML Models: ${mlModels.length}`);
  console.log(`🌤️ Weather Records: ${parks.length * 4}`);
  console.log(`👥 Crowd Data: ${parks.length * 2}`);
  console.log(`📱 Live Updates: 3`);
  console.log(`📸 Photo Contest Entries: 3`);
  console.log(`💬 Ranger Chats: 3`);
  console.log(`🔔 Notifications: 3`);
  console.log(`📊 Analytics Events: 50`);

  console.log('\n🎉 Your Trailverse database is ready to explore!');
  console.log('\n🔐 Test User Credentials:');
  console.log('Admin: krishna@trailverse.com / password123');
  console.log('User: sarah.explorer@gmail.com / password123');
  console.log('Ranger: mike.ranger@nps.gov / password123');
  console.log('Family User: alex.family@yahoo.com / password123');
  console.log('Backpacker: emily.backpacker@gmail.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
