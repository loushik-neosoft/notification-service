import { Job } from 'bull';
import { EmailRequest, EmailStatus } from '@/types';
import { IEmailRepository } from '@/database/repositories/email.repository.interface';
import { ProviderService } from '@/services/provider.service';
import { ProviderFactory } from '@/providers/provider.factory';
import { decrypt } from '@/utils/encryption';

export class EmailProcessor {
    constructor(
        private repository: IEmailRepository,
        private providerService: ProviderService
    ) { }

    async process(job: Job<{ emailId: string; request: EmailRequest }>) {
        const { emailId, request } = job.data;
        await this.repository.updateStatus(emailId, EmailStatus.PROCESSING);

        try {
            const providers = await this.providerService.getActiveProviders();

            if (providers.length === 0) {
                throw new Error('No active providers available');
            }

            let emailSent = false;

            for (const providerData of providers) {
                try {
                    let decryptedConfig;
                    try {
                        decryptedConfig = JSON.parse(decrypt(providerData.config));
                    } catch (e) {
                        throw new Error(`Failed to decrypt config for provider ${providerData.name}`);
                    }

                    const provider = ProviderFactory.create(providerData.type, decryptedConfig);

                    if (!provider) {
                        console.warn(`Skipping unknown provider type: ${providerData.type}`);
                        continue;
                    }

                    const response = await provider.send(request);

                    if (response.success) {
                        await this.repository.addAttempt(emailId, providerData.name, 'SUCCESS');
                        await this.repository.updateStatus(emailId, EmailStatus.SENT);
                        emailSent = true;
                        break; // Stop after success
                    } else {
                        throw new Error(response.error || 'Unknown provider error');
                    }
                } catch (providerError: unknown) {
                    if (providerError instanceof Error) {
                        console.error(`Provider ${providerData.name} failed:`, providerError);
                        await this.repository.addAttempt(emailId, providerData.name, 'FAILED', providerError.message);
                    }
                }
            }

            if (!emailSent) {
                throw new Error('All providers failed');
            }

        } catch (error: any) {
            console.error(`Job failed for email ${emailId}:`, error);
            if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
                await this.repository.updateStatus(emailId, EmailStatus.FAILED, error.message);
            } else {
                await this.repository.updateStatus(emailId, EmailStatus.RETRYING, error.message);
                throw error;
            }
        }
    }
}
