import { EmailProvider } from './base/email-provider.interface';
import { SendGridProvider } from './sendgrid.provider';
import { SMTPProvider } from './smtp.provider';
import { ProviderType, ProviderConfig, SendGridConfig, SMTPConfig } from '@/types';

export class ProviderFactory {
    static create(type: string, config: ProviderConfig): EmailProvider | null {
        switch (type.toLowerCase()) {
            case ProviderType.SENDGRID:
                const sgConfig = config as SendGridConfig;
                if (!sgConfig.apiKey) return null;
                return new SendGridProvider(sgConfig);
            case ProviderType.SMTP:
                const smtpConfig = config as SMTPConfig;
                // Basic validation for SMTP config
                if (!smtpConfig.host || !smtpConfig.port) return null;
                return new SMTPProvider(smtpConfig);
            default:
                return null;
        }
    }
}
