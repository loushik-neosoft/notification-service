import redisClient from '@/utils/redis';
import logger from '@/utils/logger';

export class RedisRepository {
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redisClient.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            logger.error(`Redis get failed for key ${key}`, error);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            const options = ttl ? { EX: ttl } : undefined;
            await redisClient.set(key, stringValue, options);
        } catch (error) {
            logger.error(`Redis set failed for key ${key}`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await redisClient.del(key);
        } catch (error) {
            logger.error(`Redis del failed for key ${key}`, error);
        }
    }
}
