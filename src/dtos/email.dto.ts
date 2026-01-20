import { Emails, EmailAttempts } from '@/database/types';
import { EmailResponse, EmailContent } from '@/types';
import { Selectable } from 'kysely';

// DTO for Repository Layer return value (Entity + Attempts)
export type EmailEntityWithAttempts = Selectable<Emails> & {
    attempts: Selectable<EmailAttempts>[];
};

// DTO for Service Layer return value (Domain Object / Response DTO)
export interface EmailDomainDTO extends EmailResponse {
    updatedAt: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    subject: string;
    body: EmailContent;
    attempts?: {
        created_at: string;
        provider: string;
        status: string;
        error?: string;
    }[];
}
