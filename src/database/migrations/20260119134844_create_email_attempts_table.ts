import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('email_attempts', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.uuid('email_id').references('id').inTable('emails').onDelete('CASCADE').notNullable();
        table.string('provider').notNullable();
        table.string('status').notNullable(); // SUCCESS, FAILED
        table.text('error');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}



export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('email_attempts');
}
