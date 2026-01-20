import Queue from 'bull';
import { IEmailQueue } from './email.queue.interface';
import { EmailRequest } from '@/types';

import { config } from '@/config';

export class EmailQueue implements IEmailQueue {
    private queue: Queue.Queue;

    constructor() {
        this.queue = new Queue('email-sending', {
            redis: {
                host: config.REDIS_HOST,
                port: config.REDIS_PORT
            }
        });
    }

    async add(emailId: string, request: EmailRequest): Promise<void> {
        await this.queue.add({ emailId, request }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true
        });
    }

    getQueueInstance(): Queue.Queue {
        return this.queue;
    }
}
