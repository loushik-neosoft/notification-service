import { z } from 'zod';
import { ProviderType } from '@/types';

export const smtpConfigSchema = z.object({
    host: z.string(),
    port: z.number().int(),
    secure: z.boolean(),
    auth: z.object({
        user: z.string(),
        pass: z.string()
    }).optional(),
    rateLimit: z.number().optional()
});

export const sendGridConfigSchema = z.object({
    apiKey: z.string(),
    rateLimit: z.number().optional()
});

export const providerSchema = z.object({
    name: z.string().min(1),
    type: z.nativeEnum(ProviderType),
    priority: z.number().int().min(1),
    status: z.enum(['active', 'inactive', 'down']).optional(),
    config: z.union([smtpConfigSchema, sendGridConfigSchema])
});

export type ProviderRequest = z.infer<typeof providerSchema>;

