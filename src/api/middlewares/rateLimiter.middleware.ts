import { metrics } from '@/utils/metrics';
import redisClient from '@/utils/redis';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';


export const rateLimiter = rateLimit({
    windowMs: 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    handler: (req, res, next, options) => {
        metrics.rateLimitHits.inc();
        res.status(options.statusCode).send(options.message);
    }
});
