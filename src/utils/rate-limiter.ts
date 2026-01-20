import redisClient from './redis';

export class RateLimiterUtils {
    /**
     * Checks if a provider has exceeded its rate limit.
     * Uses a sliding window (or simple expiry bucket) approach in Redis.
     * @param providerName The name of the provider
     * @param limit Max requests per window
     * @param windowSeconds Window duration in seconds (default 1s)
     * @returns true if allowed, false if limit exceeded
     */
    static async checkRateLimit(providerName: string, limit: number, windowSeconds: number = 1): Promise<boolean> {
        const key = `ratelimit:${providerName}`;

        try {
            // Increment the counter
            const current = await redisClient.incr(key);

            // If it's the first request (1), set the expiry
            if (current === 1) {
                await redisClient.expire(key, windowSeconds);
            }

            return current <= limit;
        } catch (error) {
            console.error(`RateLimiter error for ${providerName}:`, error);
            // Open fail: if Redis fails, allow the request to proceed to avoid total blockage
            return true;
        }
    }
}
