import type { Knex } from "knex";
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('providers', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('name').unique().notNullable();
        table.string('type').defaultTo('email').notNullable();
        table.integer('priority').notNullable(); // 1 = High/Primary
        table.string('status').defaultTo('active').notNullable(); // active, inactive, down
        table.text('config').notNullable(); // Encrypted JSON
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('providers');
}

