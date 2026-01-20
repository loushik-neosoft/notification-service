import { EmailRequest } from "@/types";

export interface IEmailQueue {
    add(emailId: string, request: EmailRequest): Promise<void>;
}
