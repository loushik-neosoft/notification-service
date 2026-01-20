import { EmailRequest } from '@/types';

export interface ProviderResponse {
    success: boolean;
    providerId?: string;
    error?: string;
    statusCode?: number;
}

export interface EmailProvider {
    name: string;
    send(request: EmailRequest): Promise<ProviderResponse>;
    getRateLimit(): number; // Requests per second
}
