import { EmailProvider, ProviderResponse } from './base/email-provider.interface';
import { EmailRequest, ProviderType, SMTPConfig } from '@/types';
import nodemailer from 'nodemailer';
import { config } from '@/config';

export class SMTPProvider implements EmailProvider {
    name = ProviderType.SMTP;
    private transporter: nodemailer.Transporter;
    private rateLimit: number;

    constructor(providerConfig: SMTPConfig) {
        this.transporter = nodemailer.createTransport(providerConfig);
        this.rateLimit = providerConfig.rateLimit || config.DEFAULT_RATE_LIMIT;
    }

    async send(request: EmailRequest): Promise<ProviderResponse> {
        try {
            console.log(`[SMTP] Sending email to ${request.to}`);
            const info = await this.transporter.sendMail({
                from: request.from,
                to: request.to,
                cc: request.cc,
                bcc: request.bcc,
                replyTo: request.replyTo,
                subject: request.subject,
                html: typeof request.body === 'string' ? request.body : (request.body.html || request.body.text),
                text: typeof request.body !== 'string' ? request.body.text : undefined,
            });

            return {
                success: true,
                providerId: info.messageId,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('[SMTP] Error sending email:', error);
            const statusCode = error.responseCode || 500;
            return {
                success: false,
                error: error.message,
                statusCode: statusCode
            };
        }
    }

    getRateLimit(): number {
        return this.rateLimit;
    }
}
