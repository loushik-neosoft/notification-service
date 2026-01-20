import { Emails } from '@/database/types';
import { EmailRequest, EmailStatus } from '@/types';
import { Selectable } from 'kysely';
import { EmailEntityWithAttempts } from '@/dtos/email.dto';

export interface IEmailRepository {
    create(email: EmailRequest, idempotencyKey?: string): Promise<Selectable<Emails>>;
    updateStatus(emailId: string, status: EmailStatus, error?: string): Promise<void>;
    addAttempt(emailId: string, provider: string, status: string, error?: string): Promise<void>;
    findById(emailId: string): Promise<EmailEntityWithAttempts | null>;
    findAll(filter: { status?: EmailStatus }, page: number, limit: number): Promise<{ emails: Selectable<Emails>[], total: number }>;
    findByIds(ids: string[]): Promise<Selectable<Emails>[]>;
}
