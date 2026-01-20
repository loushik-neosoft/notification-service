import { Router } from 'express';
import { EmailController } from '@/api/controllers/email.controller';
import { validateRequest } from '@/api/middlewares/validateRequest';
import { emailSchema, retryEmailSchema } from '@/api/validators/email.validator';

const createEmailRouter = (emailController: EmailController) => {
    const router = Router();

    router.post('/send', validateRequest(emailSchema), emailController.sendEmail);
    router.get('/', emailController.getEmails);
    router.post('/retry', validateRequest(retryEmailSchema), emailController.retryEmails);
    router.get('/:emailId/status', emailController.getEmailStatus);

    return router;
};

export default createEmailRouter;
