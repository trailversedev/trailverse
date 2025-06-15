// Validation Rules

export const VALIDATION_RULES = {
  USER: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
    EMAIL: {
      REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
      REQUIRE_SPECIAL: true,
    },
  },

  REVIEW: {
    TITLE: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 100,
    },
    CONTENT: {
      MIN_LENGTH: 20,
      MAX_LENGTH: 2000,
    },
    RATING: {
      MIN: 1,
      MAX: 5,
    },
  },

  TRIP: {
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    DESCRIPTION: {
      MAX_LENGTH: 500,
    },
    MAX_PARKS: 20,
    MAX_DURATION_DAYS: 365,
  },
} as const
