import client from 'prom-client';

// Collect default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics();

export const registry = client.register;

export const metrics = {
    emailsSentTotal: new client.Counter({
        name: 'emails_sent_total',
        help: 'Total number of emails sent',
        labelNames: ['provider', 'status']
    }),

    emailSendDuration: new client.Histogram({
        name: 'email_send_duration_seconds',
        help: 'Duration of email sending process',
        labelNames: ['provider'],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    }),

    rateLimitHits: new client.Counter({
        name: 'rate_limit_hits_total',
        help: 'Total number of rate limit hits'
    })
};
