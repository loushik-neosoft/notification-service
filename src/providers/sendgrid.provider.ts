import { EmailProvider, ProviderResponse } from './base/email-provider.interface';
import { EmailRequest, ProviderType, SendGridConfig } from '@/types';
import axios from 'axios';
import { config } from '@/config';

export class SendGridProvider implements EmailProvider {
    name = ProviderType.SENDGRID;
    private apiKey: string;
    private rateLimit: number;

    constructor(providerConfig: SendGridConfig) {
        this.apiKey = providerConfig.apiKey;
        this.rateLimit = providerConfig.rateLimit || config.DEFAULT_RATE_LIMIT;
    }

    async send(request: EmailRequest): Promise<ProviderResponse> {
        try {
            console.log(`[SendGrid] Sending email to ${request.to}`);

            const data = {
                personalizations: [
                    {
                        to: request.to.map(email => ({ email })),
                        cc: request.cc?.map(email => ({ email })),
                        bcc: request.bcc?.map(email => ({ email }))
                    }
                ],
                from: { email: request.from },
                reply_to: request.replyTo ? { email: request.replyTo } : undefined,
                subject: request.subject,
                content: [
                    {
                        type: 'text/plain',
                        value: request.body.text
                    },
                    request.body.html ? {
                        type: 'text/html',
                        value: request.body.html
                    } : undefined
                ].filter(Boolean)
            };

            const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                providerId: response.headers['x-message-id'] || `sg-${Date.now()}`,
                statusCode: response.status
            };
        } catch (error: any) {
            console.error('[SendGrid] Error sending email:', error.response?.data || error.message);
            const statusCode = error.response?.status || 500;
            return {
                success: false,
                error: JSON.stringify(error.response?.data) || error.message,
                statusCode: statusCode
            };
        }
    }

    getRateLimit(): number {
        return this.rateLimit;
    }
}
