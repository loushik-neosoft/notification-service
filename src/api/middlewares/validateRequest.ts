import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/utils/AppError';

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedData = schema.parse(req.body);
            req.payload = parsedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new AppError(errorMessage, 400));
            } else {
                next(error);
            }
        }
    };
};
