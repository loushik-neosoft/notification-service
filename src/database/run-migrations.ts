import logger from '@/utils/logger';

export const runMigrations = async () => {
    try {
        const knexConfig = require('./knexfile').default;
        const knex = require('knex')(knexConfig);
        await knex.migrate.latest();
        logger.info('Migrations verified');
        await knex.destroy(); // Close connection used for migrations
    } catch (error) {
        logger.error('Migration failed', error);
        process.exit(1);
    }
};
