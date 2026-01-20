import { EmailRequest, ProviderType } from "@/types";

export interface IProviderSelectionStrategy {
    selectProvider(request: EmailRequest): string;
}

export class RoundRobinStrategy implements IProviderSelectionStrategy {
    private providers: string[] = [ProviderType.SENDGRID, ProviderType.SMTP];
    private currentIndex = 0;

    selectProvider(request: EmailRequest): string {
        const provider = this.providers[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.providers.length;
        return provider;
    }
}
