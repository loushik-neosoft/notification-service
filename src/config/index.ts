import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config()
dotenv.config({
    path: '../../.env'
})

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().transform(Number).default('8000'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform(Number).default('6379'),
    MASTER_KEY: z.string().length(64, 'Master key must be 64 characters long').regex(/^[0-9a-fA-F]+$/, 'Master key must be a valid hex string'),
    DEFAULT_RATE_LIMIT: z.string().transform(Number).default('10'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('Invalid environment variables:', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const config = _env.data;
