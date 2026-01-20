import { ProviderRepository } from '@/database/repositories/provider.repository';
import { RedisRepository } from '@/database/repositories/redis.repository';
import { Selectable } from 'kysely';
import { Providers } from '@/database/types';
import logger from '@/utils/logger';

const PROVIDERS_CACHE_KEY = 'providers:active';
const CACHE_TTL = 3600; // 1 hour

export class ProviderService {
    constructor(
        private providerRepository: ProviderRepository,
        private redisRepository: RedisRepository
    ) { }

    async getActiveProviders(): Promise<Selectable<Providers>[]> {
        // Try cache first
        const cached = await this.redisRepository.get<Selectable<Providers>[]>(PROVIDERS_CACHE_KEY);
        if (cached) {
            return cached;
        }

        // Fetch from DB
        const providers = await this.providerRepository.getActiveProviders();

        // Update cache
        await this.redisRepository.set(PROVIDERS_CACHE_KEY, providers, CACHE_TTL);

        return providers;
    }

    async markProviderDown(name: string): Promise<void> {
        await this.providerRepository.markProviderDown(name);
        await this.invalidateCache();
    }

    async setProviderConfig(provider: { name: string; type: string; priority: number; config: string; status?: string }): Promise<void> {
        await this.providerRepository.setProviderConfig(provider);
        await this.invalidateCache();
    }

    private async invalidateCache(): Promise<void> {
        await this.redisRepository.del(PROVIDERS_CACHE_KEY);
        logger.info('Provider cache invalidated');
    }
}
