// Feature Flags

export const FEATURE_FLAGS = {
  AI_RECOMMENDATIONS: 'ai_recommendations',
  AR_FEATURES: 'ar_features',
  VOICE_FEATURES: 'voice_features',
  REAL_TIME_UPDATES: 'real_time_updates',
  SOCIAL_FEATURES: 'social_features',
  PAYMENT_FEATURES: 'payment_features',
  BETA_FEATURES: 'beta_features',
} as const

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  [FEATURE_FLAGS.AI_RECOMMENDATIONS]: true,
  [FEATURE_FLAGS.AR_FEATURES]: true,
  [FEATURE_FLAGS.VOICE_FEATURES]: true,
  [FEATURE_FLAGS.REAL_TIME_UPDATES]: true,
  [FEATURE_FLAGS.SOCIAL_FEATURES]: true,
  [FEATURE_FLAGS.PAYMENT_FEATURES]: false,
  [FEATURE_FLAGS.BETA_FEATURES]: false,
}
