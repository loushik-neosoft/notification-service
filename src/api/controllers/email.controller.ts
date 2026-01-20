import { Request, Response, NextFunction } from 'express';
import { EmailService } from '@/services/email.service';
import { AppError } from '@/utils/AppError';
import { EmailRequest, EmailStatus } from '@/types';

export class EmailController {
    constructor(private emailService: EmailService) { }

    // POST /api/v1/emails/send
    sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validatedData = req.payload as EmailRequest

            const result = await this.emailService.sendEmail(validatedData);

            res.status(202).json(result);

        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/emails/:emailId/status
    getEmailStatus = async (req: Request, res: Response, next: NextFunction) => {
        const { emailId } = req.params;

        try {
            const result = await this.emailService.getEmailStatus(emailId);
            if (!result) throw new AppError('Email not found', 404);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
    // GET /api/v1/emails
    getEmails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status

            const result = await this.emailService.getEmailsByStatus(status as EmailStatus, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/emails/retry
    retryEmails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { emailIds } = req.payload as { emailIds: string[] }
            await this.emailService.retryEmails(emailIds);
            res.json({
                message: 'Emails retried successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}
