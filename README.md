# Notification Service

A reliable, scalable backend service for sending emails using multiple providers (SendGrid, SMTP, etc.) with built-in failover capabilities.

## Architecture & Design

The service follows a layered architecture to ensure separation of concerns and testability:

1.  **API Layer** (`src/api`): Handles HTTP requests, validation, and interaction with the service layer.
2.  **Service Layer** (`src/services`): Contains business logic. It validates requests, persists email records to the database, and pushes jobs to the processing queue.
3.  **Queue System** (`src/queue`): Uses **Bull** (Redis-backed) for asynchronous processing. This ensures that the API remains fast and responsive even under load.
4.  **Worker/Processor** (`src/queue/processors`): A background worker consumes jobs from the queue. It is responsible for orchestrating the actual email sending process, including provider selection and fallback.
5.  **Provider Layer** (`src/providers`): Implements the **Strategy Pattern**. Each email provider (SMTP, SendGrid) implements a common `EmailProvider` interface. A `ProviderFactory` is used to instantiate the correct provider based on configuration.
6.  **Data Layer** (`src/database`): Interactions with PostgreSQL using **Knex** (for migrations) and **Kysely** (for type-safe queries).

### Design Choices
-   **Asynchronous Processing**: Emails are not sent immediately in the request-response cycle. Instead, they are queued. This decoupling allows for better error handling, retries, and scalability.
-   **Idempotency**: The API enforces idempotency via the `IdempotencyMiddleware`. Clients can safely retry requests without sending duplicate emails.
-   **Database-Driven Provider Config**: Provider configurations are stored in the database (encrypted), allowing for dynamic addition/removal of providers without redeploying the service.

## Provider Handling

The service supports multiple email providers to ensure high availability.

1.  **Selection Strategy**: The `EmailProcessor` retrieves a list of active providers from the `ProviderRepository`.
2.  **Failover Logic**: The processor iterates through the available providers.
    -   It attempts to send the email using the first provider.
    -   If successful, the loop terminates, and the email status is updated to `SENT`.
    -   If a provider fails, the error is logged, an attempt record is created, and the loop continues to the next provider.
    -   If **all** providers fail, the email is marked as `RETRYING` (if attempts remain) or `FAILED`.

## Rate Limiting

Rate limiting is implemented at multiple levels:

1.  **API Rate Limiting**: Uses `express-rate-limit` backed by Redis (`rate-limit-redis`). This protects the API endpoints from abuse (e.g., DDOS).
2.  **Provider Rate Limiting**: (Planned/Partial) Individual providers have a `rateLimit` property in their configuration. Currently, this is used for reference, but future implementations can use this to throttle outgoing requests per provider to avoid hitting third-party limits.

## Retry Strategy & Failure Handling

Robustness is central to the design:

1.  **Queue Retries**: The Bull queue is configured with a retry policy (default 3 attempts) with backoff. If the worker throws an error (e.g., all providers failed), the job is returned to the queue to be retried later.
2.  **Manual Retry**: A specialized endpoint `POST /api/v1/emails/retry` allows administrators to manually trigger retries for failed emails. This moves them from `FAILED` back to `QUEUED` status.
3.  **Dead Letter Queue**: (Implicit) After max retries, emails stay in `FAILED` status in the database, acting as a DLQ for inspection.

## Trade-offs

-   **Simple Routing**: Currently, provider selection iterates through all active providers in a fixed order (or arbitrary DB order). There is no complex routing logic (e.g., "Use SendGrid for Transactional, SMTP for Marketing") or weighted load balancing yet.
-   **Single Process Worker**: For simplicity in this iteration, the worker runs in the same Node.js process as the API server. In a high-scale production environment, these should be split into separate deployments (e.g., `web` vs `worker` containers) to scale independently.

## Setup & Running with Docker

### Prerequisites
-   Docker & Docker Compose installed.

### Steps

1.  **Clone & Configure**
    ```bash
    cp .env.example .env
    # Update .env with your specific secrets if needed
    ```

2.  **Run with Docker Compose**
    This command builds the application image and starts Postgres, Redis, and the Node.js service.
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify Status**
    Check if containers are running:
    ```bash
    docker-compose ps
    ```
    View logs:
    ```bash
    docker-compose logs -f notification_service
    ```

4.  **Access**
    The API will be available at `http://localhost:8080`.
    -   Health Check: `GET /health`

## API Documentation

A Postman collection is available for testing and exploring the API endpoints.

-   **Location**: `docs/notification-service.postman_collection.json`
-   **Usage**: Import this file into Postman to see pre-configured requests for emails, providers, and health checks.

## Configuration

The service is configured via environment variables. Copy `.env.example` to `.env` and adjust as needed.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Service port | `8000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `LOG_LEVEL` | Logging level (`info`, `debug`, `error`, etc.) | `info` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `MASTER_KEY` | 32-byte hex string for encryption (64 chars) | - |
| `DEFAULT_RATE_LIMIT`| API rate limit per window | `10` |

### Security Note
The `MASTER_KEY` is critical for encrypting provider configurations. Ensure it is a valid 64-character hex string.

## Manual Development Setup

1.  **Install Dependencies**
    ```bash
    pnpm install
    # or npm install
    ```

2.  **Start Infrastructure Only**
    ```bash
    docker-compose up -d postgres redis
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## API Endpoints

### Emails

#### 1. Send Email
-   **URL**: `POST /api/v1/emails/send`
-   **Description**: Accepts an email request and queues it for sending. Returns an ID for tracking/status.
-   **Body**:
    ```json
    {
      "to": "user@example.com",
      "subject": "Hello",
      "body": "This is a test email.",
      "contentType": "text/plain" // Optional: "text/html"
    }
    ```
-   **Response** (`202 Accepted`):
    ```json
    {
      "id": "uuid-v4",
      "status": "QUEUED"
    }
    ```

#### 2. Get Email Status
-   **URL**: `GET /api/v1/emails/:emailId/status`
-   **Description**: Retrieval of the current status and attempt history of a specific email.
-   **Response** (`200 OK`):
    ```json
    {
      "id": "uuid-v4",
      "status": "SENT",
      "attempts": [
        { "provider": "smtp-provider", "status": "SUCCESS", "timestamp": "..." }
      ]
    }
    ```

#### 3. List Emails
-   **URL**: `GET /api/v1/emails?page=1&limit=10&status=failed`
-   **Description**: Paginated list of emails, optionally filtered by status (e.g., `failed`, `sent`, `queued`).
-   **Response** (`200 OK`):
    ```json
    {
      "data": [ ... ],
      "meta": {
        "page": 1,
        "limit": 10,
        "total": 50
      }
    }
    ```

#### 4. Retry Emails
-   **URL**: `POST /api/v1/emails/retry`
-   **Description**: Manually triggers a retry for specific failed emails. Moves them back to the queue.
-   **Body**:
    ```json
    {
      "emailIds": ["uuid-1", "uuid-2"]
    }
    ```
-   **Response** (`200 OK`):
    ```json
    {
      "message": "Emails retried successfully"
    }
    ```

### Providers

#### 1. Configure Provider
-   **URL**: `POST /api/v1/providers`
-   **Headers**: `x-admin-key: <MASTER_KEY>`
-   **Description**: Adds or updates a provider configuration. The config is encrypted before storage.
-   **Body**:
    ```json
    {
      "name": "sendgrid-main",
      "type": "sendgrid",
      "priority": 1,
      "config": {
        "apiKey": "SG.xxxx"
      }
    }
    ```
-   **Response** (`200 OK`):
    ```json
    {
      "message": "Provider configured successfully",
      "provider": "sendgrid-main"
    }
    ```
