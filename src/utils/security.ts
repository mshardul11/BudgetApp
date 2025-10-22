/**
 * Security utility functions for input validation and sanitization
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000) // Limit length
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return ''
  }
  
  // Remove all HTML tags and attributes
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 1000)
}

/**
 * Validate numeric input
 */
export function validateNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value)
  if (isNaN(num)) return false
  
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  
  return true
}

/**
 * Validate date input
 */
export function validateDate(date: any): boolean {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto API if available
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  
  return result
}

/**
 * Hash a string (simple implementation - for production use a proper hashing library)
 */
export function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempt = this.attempts.get(key)
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false
    }
    
    attempt.count++
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
  
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key)
    if (!attempt) return this.maxAttempts
    return Math.max(0, this.maxAttempts - attempt.count)
  }
}

/**
 * CSRF token utility
 */
export class CSRFProtection {
  private static tokenKey = 'csrf_token'
  
  static generateToken(): string {
    const token = generateSecureToken(32)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token)
    }
    return token
  }
  
  static getToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(this.tokenKey)
    }
    return null
  }
  
  static validateToken(token: string): boolean {
    const storedToken = this.getToken()
    return storedToken === token
  }
  
  static clearToken(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey)
    }
  }
}