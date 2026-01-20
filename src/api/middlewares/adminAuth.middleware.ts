import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';

import { config } from '@/config';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-key'];

    if (!adminKey || adminKey !== config.MASTER_KEY) {
        return next(new AppError('Unauthorized: Invalid Admin Key', 401));
    }

    next();
};
