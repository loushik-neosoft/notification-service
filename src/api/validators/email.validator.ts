import { z } from 'zod';

export const emailSchema = z.object({
    to: z.array(z.string().email()).min(1, "At least one recipient is required"),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    subject: z.string().min(1, "Subject is required"),
    body: z.object({
        text: z.string().min(1, "Plain text body is required"),
        html: z.string().optional(),
    }),
    from: z.string().email("Invalid sender email"),
    replyTo: z.string().email().optional(),
});


export const retryEmailSchema = z.object({
    emailIds: z.array(z.string().uuid()).min(1, "At least one email ID is required")
});

export type EmailRequestSchema = z.infer<typeof emailSchema>;

