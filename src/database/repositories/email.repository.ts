import { IEmailRepository } from './email.repository.interface';
import { EmailEntityWithAttempts } from '@/dtos/email.dto';
import { EmailRequest, EmailStatus } from '@/types';
import { db } from '@/database/db';
import { v4 as uuidv4 } from 'uuid';
import { Emails } from '@/database/types';
import { Selectable } from 'kysely';

export class EmailRepository implements IEmailRepository {
    async create(request: EmailRequest, idempotencyKey?: string): Promise<Selectable<Emails>> {
        const emailId = uuidv4();
        // Since we are using "Emails" type which is generated, status should match strict string type if defined as enum in DB, 
        // but typically kysely types are strings. EmailStatus enum values should be compatible.

        return await db
            .insertInto('emails')
            .values({
                id: emailId,
                to_address: request.to, // kysely-pg driver handles string[] -> text[]
                from_address: request.from,
                cc: request.cc || null,
                bcc: request.bcc || null,
                reply_to: request.replyTo || null,
                subject: request.subject,
                body: JSON.stringify(request.body),
                status: EmailStatus.QUEUED
            })
            // .returningAll() is postgres specific.
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async updateStatus(emailId: string, status: EmailStatus, error?: string): Promise<void> {
        await db
            .updateTable('emails')
            .set({
                status: status,
                error: error || null,
                updated_at: new Date() // Type is Timestamp (Date | string)
            })
            .where('id', '=', emailId)
            .execute();
    }

    async addAttempt(emailId: string, provider: string, status: string, error?: string): Promise<void> {
        await db
            .insertInto('email_attempts')
            .values({
                email_id: emailId,
                provider: provider,
                status: status,
                error: error || null
            })
            .execute();
    }

    async findById(emailId: string): Promise<EmailEntityWithAttempts | null> {
        const result = await db
            .selectFrom('emails')
            .selectAll()
            .where('id', '=', emailId)
            .executeTakeFirst();

        if (!result) return null;

        // Fetch attempts
        const attempts = await db
            .selectFrom('email_attempts')
            .selectAll()
            .where('email_id', '=', emailId)
            .orderBy('created_at', 'desc')
            .execute();

        return {
            ...result,
            attempts: attempts
        };
    }

    async findAll(filter: { status?: EmailStatus }, page: number, limit: number): Promise<{ emails: Selectable<Emails>[], total: number }> {
        const offset = (page - 1) * limit;

        let query = db.selectFrom('emails').selectAll();
        let countQuery = db.selectFrom('emails').select(db.fn.count('id').as('count'));

        if (filter.status) {
            query = query.where('status', '=', filter.status);
            countQuery = countQuery.where('status', '=', filter.status);
        }

        const [results, countResult] = await Promise.all([
            query.limit(limit).offset(offset).orderBy('created_at', 'desc').execute(),
            countQuery.executeTakeFirst()
        ]);

        const total = Number(countResult?.count || 0);

        return { emails: results, total };
    }

    async findByIds(ids: string[]): Promise<Selectable<Emails>[]> {
        if (ids.length === 0) return [];

        return await db
            .selectFrom('emails')
            .selectAll()
            .where('id', 'in', ids)
            .execute();
    }
}
