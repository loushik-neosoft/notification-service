import type { Knex } from 'knex';
import path from 'path';

import { config } from '../config';

const configKnex: Knex.Config = {
    client: 'pg',
    connection: config.DATABASE_URL,
    migrations: {
        directory: path.join(__dirname, 'migrations'),
        extension: process.env.NODE_ENV === 'production' ? 'js' : 'ts',
        tableName: 'knex_migrations'
    }
};

export default configKnex;
