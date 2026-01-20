import { IEmailRepository } from '@/database/repositories/email.repository.interface';
import { Emails, EmailAttempts } from '@/database/types';
import { IEmailQueue } from '@/queue/email.queue.interface';
import { EmailRequest, EmailResponse, EmailStatus, EmailContent } from '@/types';
import { Selectable } from 'kysely';
import { EmailDomainDTO } from '@/dtos/email.dto';

export class EmailService {
    constructor(private emailRepository: IEmailRepository, private emailQueue: IEmailQueue) { }

    async sendEmail(request: EmailRequest, idempotencyKey?: string): Promise<EmailResponse> {
        // Repository returns "Emails" entity
        const entity = await this.emailRepository.create(request, idempotencyKey);

        // Map to Response/Domain Record
        const record = this.mapEntityToDomain(entity);

        await this.emailQueue.add(record.emailId, request);
        return record;
    }

    async getEmailStatus(emailId: string): Promise<EmailDomainDTO | null> {
        const entity = await this.emailRepository.findById(emailId);
        if (!entity) return null;

        return this.mapEntityToDomain(entity, entity.attempts);
    }

    async getEmailsByStatus(status: EmailStatus, page: number = 1, limit: number = 10): Promise<EmailDomainDTO[]> {
        const result = await this.emailRepository.findAll({ status }, page, limit);
        return result.emails.map(e => this.mapEntityToDomain(e));
    }

    async retryEmails(emailIds: string[]): Promise<void> {
        const emails = await this.emailRepository.findByIds(emailIds);

        for (const emailEntity of emails) {
            if (emailEntity.status === EmailStatus.FAILED) {
                // Update status to QUEUED first
                await this.emailRepository.updateStatus(emailEntity.id, EmailStatus.QUEUED);

                // Re-construct request from entity to queue it
                // We need to parse body properly
                let bodyContent = emailEntity.body;
                if (typeof bodyContent === 'string') {
                    try {
                        bodyContent = JSON.parse(bodyContent);
                    } catch (e) {
                        bodyContent = { text: bodyContent };
                    }
                }

                const request: EmailRequest = {
                    to: emailEntity.to_address,
                    from: emailEntity.from_address || '', // Should not be null if created correctly
                    subject: emailEntity.subject,
                    body: bodyContent as unknown as EmailContent,
                    cc: emailEntity.cc || undefined,
                    bcc: emailEntity.bcc || undefined,
                    replyTo: emailEntity.reply_to || undefined
                };

                await this.emailQueue.add(emailEntity.id, request);
            }
        }
    }

    private mapEntityToDomain(entity: Selectable<Emails>, attempts: Selectable<EmailAttempts>[] = []): EmailDomainDTO {
        let bodyContent = entity.body;
        if (typeof bodyContent === 'string') {
            try {
                bodyContent = JSON.parse(bodyContent);
            } catch (e) {
                bodyContent = { text: bodyContent };
            }
        }

        return {
            emailId: entity.id,
            status: entity.status as EmailStatus,
            createdAt: entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString(),
            updatedAt: entity.updated_at ? new Date(entity.updated_at).toISOString() : new Date().toISOString(),
            error: entity.error || undefined,
            body: bodyContent as unknown as EmailContent,
            from: entity.from_address || '',
            to: entity.to_address || [],
            cc: entity.cc || undefined,
            bcc: entity.bcc || undefined,
            replyTo: entity.reply_to || undefined,
            subject: entity.subject || '',
            attempts: attempts.map(a => ({
                created_at: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),
                provider: a.provider,
                status: a.status,
                error: a.error || undefined
            }))
        };
    }
}
