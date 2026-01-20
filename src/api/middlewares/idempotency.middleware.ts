import { Request, Response, NextFunction } from 'express';
import redisClient from '@/utils/redis';
import logger from '@/utils/logger';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-idempotency-key'] as string;

    if (!key) {
        return next();
    }

    const redisKey = `idempotency:${key}`;

    try {
        const cachedResponse = await redisClient.get(redisKey);

        if (cachedResponse) {
            logger.info(`Idempotency hit for key: ${key}`);
            const { status, body } = JSON.parse(cachedResponse);
            return res.status(status).json(body);
        }

        // Hook into res.json to cache the response
        const originalJson = res.json;

        res.json = function (body) {
            const responseData = {
                status: res.statusCode,
                body
            };

            // Cache for 24 hours
            redisClient.set(redisKey, JSON.stringify(responseData), {
                EX: 24 * 60 * 60
            }).catch(err => {
                logger.error('Failed to cache idempotency key', err);
            });

            return originalJson.call(this, body);
        };

        next();
    } catch (error) {
        logger.error('Idempotency error', error);
        next();
    }
};
