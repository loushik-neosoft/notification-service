import { Router } from 'express';
import { ProviderController } from '@/api/controllers/provider.controller';
import { validateRequest } from '@/api/middlewares/validateRequest';
import { providerSchema } from '@/api/validators/provider.validator';
import { adminAuth } from '@/api/middlewares/adminAuth.middleware';

const createProviderRouter = (providerController: ProviderController) => {
    const router = Router();

    router.post('/', adminAuth, validateRequest(providerSchema), providerController.configureProvider);

    return router;
};

export default createProviderRouter;
