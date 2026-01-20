import { db } from '@/database/db';
import { Selectable } from 'kysely';
import { Providers } from '@/database/types';

export class ProviderRepository {
    async getActiveProviders(): Promise<Selectable<Providers>[]> {
        return await db
            .selectFrom('providers')
            .selectAll()
            .where('status', '!=', 'inactive')
            .orderBy('priority', 'asc')
            .execute();
    }

    async markProviderDown(name: string): Promise<void> {
        await db
            .updateTable('providers')
            .set({
                status: 'down',
                updated_at: new Date().toISOString()
            })
            .where('name', '=', name)
            .execute();
    }

    async setProviderConfig(provider: { name: string; type: string; priority: number; config: string; status?: string }): Promise<void> {
        await db
            .insertInto('providers')
            .values({
                name: provider.name,
                type: provider.type,
                priority: provider.priority,
                config: provider.config,
                status: provider.status || 'active',
                updated_at: new Date().toISOString()
            })
            .onConflict((oc) => oc
                .column('name')
                .doUpdateSet({
                    type: provider.type,
                    priority: provider.priority,
                    config: provider.config,
                    status: provider.status || 'active',
                    updated_at: new Date()
                })
            )
            .execute();
    }
}
