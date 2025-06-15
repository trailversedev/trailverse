// Validation Utilities
import { VALIDATION_RULES } from '../../constants/validation/rules'

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.USER.EMAIL.REGEX.test(email)
}

export const validatePassword = (
  password: string
): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  const rules = VALIDATION_RULES.USER.PASSWORD

  if (password.length < rules.MIN_LENGTH) {
    errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`)
  }

  if (password.length > rules.MAX_LENGTH) {
    errors.push(`Password must be less than ${rules.MAX_LENGTH} characters long`)
  }

  if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (rules.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (rules.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}
