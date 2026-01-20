import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '@/utils/logger';

import { AppError } from '@/utils/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof ZodError) {
        logger.warn(`Validation Error: ${req.method} ${req.url}`, { details: err.errors });
        res.status(400).json({
            error: 'Validation Error',
            details: err.errors
        });
        return;
    }

    if (err instanceof AppError) {
        logger.warn(`Operational Error: ${err.message}`, { statusCode: err.statusCode });
        res.status(err.statusCode).json({
            error: err.message
        });
        return;

    }

    logger.error(`Internal Server Error: ${req.method} ${req.url}`, { error: err.message, stack: err.stack });
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
