import { createClient } from 'redis';
import { config } from '@/config';
import logger from '@/utils/logger';

const redisClient = createClient({
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
    }
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

redisClient.connect().catch(err => logger.error('Redis Connection Error', err));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;
