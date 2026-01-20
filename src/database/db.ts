import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './types';

import { config } from '@/config';

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: config.DATABASE_URL,
        max: 10,
    })
});

export const db = new Kysely<DB>({
    dialect,
});

export default db;
