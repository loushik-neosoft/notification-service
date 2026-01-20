import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import emailRoutes from '@/api/routes/email.routes';
import providerRoutes from '@/api/routes/provider.routes';
import { v4 as uuidv4 } from 'uuid';

import { EmailQueue } from '@/queue/email.queue';
import { EmailProcessor } from '@/queue/processors/email.processor';
import { EmailRepository } from '@/database/repositories/email.repository';
import { ProviderRepository } from '@/database/repositories/provider.repository';
import { RedisRepository } from '@/database/repositories/redis.repository';
import { EmailService } from '@/services/email.service';
import { ProviderService } from '@/services/provider.service';
import { EmailController } from '@/api/controllers/email.controller';
import { ProviderController } from '@/api/controllers/provider.controller';
import { rateLimiter } from '@/api/middlewares/rateLimiter.middleware';
import { registry } from '@/utils/metrics';
import logger from '@/utils/logger';
import { errorHandler } from '@/api/middlewares/error.middleware';
import { notFoundHandler } from '@/api/middlewares/notFound.middleware';
import { idempotencyMiddleware } from '@/api/middlewares/idempotency.middleware';
import { connectRedis } from '@/utils/redis';
import { runMigrations } from '@/database/run-migrations';

import { config } from '@/config';

const app: Express = express();
const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request ID Middleware
app.use((req: Request, _res: Response, next) => {
    req.headers['x-request-id'] = (req.headers['x-request-id'] as string) || uuidv4();
    next();
});

// Idempotency Middleware
app.use(idempotencyMiddleware);

// Rate Limiter
app.use(rateLimiter);

// Request Logging
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.url}`);
    next();
});

// Initialize Dependencies

const emailRepository = new EmailRepository();
const redisRepository = new RedisRepository();
const providerRepository = new ProviderRepository();
const providerService = new ProviderService(providerRepository, redisRepository);
const emailQueue = new EmailQueue();
const emailService = new EmailService(emailRepository, emailQueue);
const emailProcessor = new EmailProcessor(emailRepository, providerService);

const emailController = new EmailController(emailService);
const providerController = new ProviderController(providerService);

// Register Routes
app.use('/api/v1/emails', emailRoutes(emailController));
app.use('/api/v1/providers', providerRoutes(providerController));


// Metrics Endpoint
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Initialize System
const startServer = async () => {
    await runMigrations();
    await connectRedis();
    const queueInstance = emailQueue.getQueueInstance();
    try {
        queueInstance.process(async (job) => {
            await emailProcessor.process(job);
        });
        logger.info('Worker started');
    } catch (e) {
        logger.error('Failed to start worker', e);
    }

    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer().catch(console.error);
}

export default app;
