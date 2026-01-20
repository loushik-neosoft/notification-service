import { ProviderType } from "@/types";
import { Selectable } from "kysely";
import { Providers } from "@/database/types";
import redisClient from "@/utils/redis"; // Using existing redis client

export interface IProviderSelectionStrategy {
    selectProviders(providers: Selectable<Providers>[]): Promise<Selectable<Providers>[]>;
}

export class RoundRobinStrategy implements IProviderSelectionStrategy {

    async selectProviders(providers: Selectable<Providers>[]): Promise<Selectable<Providers>[]> {
        if (providers.length <= 1) return providers;

        const key = 'provider:round_robin:index';

        try {
            // Increment global counter to rotate starting position
            const index = await redisClient.incr(key);

            // Calculate starting offset
            const startOffset = index % providers.length;

            // Rotate the array based on the offset
            return [
                ...providers.slice(startOffset),
                ...providers.slice(0, startOffset)
            ];
        } catch (error) {
            console.error('RoundRobinStrategy redis error:', error);
            // Fallback to original order on error
            return providers;
        }
    }
}
