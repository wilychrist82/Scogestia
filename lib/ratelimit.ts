import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis if env vars are present, otherwise return null
// We use a getter to avoid throwing errors during build if env vars are missing
const getRedisClient = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return null
}

const redis = getRedisClient()

// Rate limiter for Webhooks (CinetPay)
// e.g. 10 requests per 10 seconds per IP
export const webhookRateLimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/webhook',
    })
  : null

// Rate limiter for Login / Auth attempts
// e.g. 5 requests per 5 minutes per identifier (phone number or IP)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null

export async function checkRateLimit(
  limiter: Ratelimit | null, 
  identifier: string
): Promise<{ success: boolean, reset?: number }> {
  if (!limiter) {
    // If Upstash is not configured, we bypass rate limiting (useful for local dev without env vars)
    return { success: true }
  }
  
  try {
    const result = await limiter.limit(identifier)
    return { success: result.success, reset: result.reset }
  } catch (error) {
    console.error("Rate limit error:", error)
    // Fail open in case of Redis connection error to not block legitimate traffic
    return { success: true }
  }
}
