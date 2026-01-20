import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('emails', (table) => {
        table.uuid('id').primary();
        table.string('from_address').nullable();
        table.specificType('to_address', 'TEXT[]').notNullable();
        table.specificType('cc', 'TEXT[]').nullable();
        table.specificType('bcc', 'TEXT[]').nullable();
        table.string('reply_to').nullable();
        table.text('subject').notNullable();
        table.jsonb('body').notNullable();
        table.string('status', 50).notNullable();
        table.text('error').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('emails');
}
