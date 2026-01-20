import 'express';

declare module 'express' {
    export interface Request {
        payload?: any;
    }
}
