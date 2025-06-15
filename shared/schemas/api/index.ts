// API Schemas using Zod
import { z } from 'zod'
import { VALIDATION_RULES } from '../../constants/validation/rules'

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(
      VALIDATION_RULES.USER.NAME.MIN_LENGTH,
      `Name must be at least ${VALIDATION_RULES.USER.NAME.MIN_LENGTH} characters`
    )
    .max(
      VALIDATION_RULES.USER.NAME.MAX_LENGTH,
      `Name must be less than ${VALIDATION_RULES.USER.NAME.MAX_LENGTH} characters`
    ),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(
      VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH,
      `Password must be at least ${VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH} characters`
    )
    .max(
      VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH,
      `Password must be less than ${VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH} characters`
    ),
})

// Review schemas
export const CreateReviewSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.REVIEW.TITLE.MIN_LENGTH)
    .max(VALIDATION_RULES.REVIEW.TITLE.MAX_LENGTH),
  content: z
    .string()
    .min(VALIDATION_RULES.REVIEW.CONTENT.MIN_LENGTH)
    .max(VALIDATION_RULES.REVIEW.CONTENT.MAX_LENGTH),
  rating: z
    .number()
    .int()
    .min(VALIDATION_RULES.REVIEW.RATING.MIN)
    .max(VALIDATION_RULES.REVIEW.RATING.MAX),
  visitDate: z.string().datetime(),
  images: z.array(z.string().url()).optional(),
})

// Trip schemas
export const CreateTripSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.TRIP.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.TRIP.NAME.MAX_LENGTH),
  description: z.string().max(VALIDATION_RULES.TRIP.DESCRIPTION.MAX_LENGTH).optional(),
  parks: z
    .array(z.string())
    .min(1, 'At least one park is required')
    .max(
      VALIDATION_RULES.TRIP.MAX_PARKS,
      `Maximum ${VALIDATION_RULES.TRIP.MAX_PARKS} parks allowed`
    ),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPublic: z.boolean().default(false),
})

export type LoginRequest = z.infer<typeof LoginSchema>
export type RegisterRequest = z.infer<typeof RegisterSchema>
export type CreateReviewRequest = z.infer<typeof CreateReviewSchema>
export type CreateTripRequest = z.infer<typeof CreateTripSchema>
