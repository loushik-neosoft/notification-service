import { Request, Response, NextFunction } from 'express';
import { ProviderService } from '@/services/provider.service';
import { encrypt } from '@/utils/encryption';

export class ProviderController {
    constructor(private providerService: ProviderService) { }

    configureProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validatedData = req.payload
            const encryptedConfig = encrypt(JSON.stringify(validatedData.config));

            await this.providerService.setProviderConfig({
                name: validatedData.name,
                type: validatedData.type,
                priority: validatedData.priority,
                config: encryptedConfig,
                status: validatedData.status
            });

            res.status(200).json({ message: 'Provider configured successfully', provider: validatedData.name });

        } catch (error) {
            next(error);
        }
    }
}
