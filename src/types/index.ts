export interface EmailContent {
    text: string;
    html?: string;
}

export interface EmailRequest {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: EmailContent;
    from: string;
    replyTo?: string;
}

export enum EmailStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    SENT = 'sent',
    FAILED = 'failed',
    RETRYING = 'retrying'
}

export enum ProviderType {
    SENDGRID = 'sendgrid',
    SMTP = 'smtp'
}

export interface BaseProviderConfig {
    rateLimit?: number;
}

export interface SMTPConfig extends BaseProviderConfig {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
        user: string;
        pass: string;
    };
}

export interface SendGridConfig extends BaseProviderConfig {
    apiKey: string;
}

export type ProviderConfig = SMTPConfig | SendGridConfig;

export interface EmailResponse {
    emailId: string;
    status: EmailStatus;
    createdAt: string;
    error?: string;
}

export interface APIError {
    message: string;
    code: string;
    details?: unknown;
}
