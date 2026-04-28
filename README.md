# Smart Mall Management System (Microservices)

A complete demo microservice-based application for a cloud computing assignment.

## Project Structure

```text
root/
├── user-service/
├── contract-service/
├── payment-service/
├── notification-service/
├── frontend/
├── .github/workflows/ci.yml
└── docker-compose.yml
```

## Tech Stack

- Backend: Node.js + Express
- Frontend: React + Vite + Axios
- Storage: In-memory arrays
- API Documentation: Swagger UI (OpenAPI 3)
- Security: JWT auth, environment variables, validation checks
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions

## Microservices and Ports

- `user-service` on `3001`
- `contract-service` on `3002`
- `payment-service` on `3003`
- `notification-service` on `3004`
- `frontend` on `5173` (served by Nginx inside container)

## Inter-service Communication

Implemented required service calls:

1. `contract-service -> user-service`

- Validates user before contract application.

2. `contract-service -> notification-service`

- Sends notification when contract is approved.

3. `payment-service -> contract-service`

- Validates contract before payment.

4. `payment-service -> notification-service`

- Sends notification after successful payment.

All inter-service Axios calls in `contract-service` and `payment-service` include a timeout and retry helper for better resilience during startup/transient failures.

## Security

- JWT-based protected routes.
- Shared `JWT_SECRET` across services for demo simplicity.
- Internal service calls protected by `x-service-token` header.
- Basic request validation on all create/update endpoints.

## API Docs

Swagger UI endpoints:

- `http://localhost:3001/api-docs` (User Service)
- `http://localhost:3002/api-docs` (Contract Service)
- `http://localhost:3003/api-docs` (Payment Service)
- `http://localhost:3004/api-docs` (Notification Service)

## Run with Docker Compose

From project root:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up --build -d
```

Check status:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

Then open:

- Frontend: `http://localhost:5173`

## Local Run Without Docker (Optional)

Run each service in separate terminals:

```bash
cd user-service && npm install && npm start
cd contract-service && npm install && npm start
cd payment-service && npm install && npm start
cd notification-service && npm install && npm start
cd frontend && npm install && npm run dev
```

## Automated End-to-End Validation

After services are running (Docker or local), execute:

```bash
node scripts/e2e-check.js
```

Expected output:

- `STEP1_REGISTER=PASS`
- `STEP2_LOGIN=PASS`
- `STEP3_APPLY=PASS`
- `STEP4_APPROVE=PASS`
- `STEP5_PAYMENT=PASS`
- `STEP6_NOTIFICATIONS=PASS`

## Demo Flow

1. Register two users from frontend:

- One with role `admin`
- One with role `student`

2. Login as student and apply contract.

3. Login as admin and approve contract.

4. Login as student and pay for approved contract.

5. Open notification panel to see approval and payment notifications.

## Debugging Guide

Common issue: `docker compose up` fails with `open //./pipe/dockerDesktopLinuxEngine`.

Fix:

1. Start Docker Desktop.
2. Wait until Docker shows `Engine running`.
3. Re-run `docker compose up --build`.

Useful checks:

```bash
docker compose config
docker compose logs -f contract-service
docker compose logs -f payment-service
```

Health endpoints:

- `http://localhost:3001/health`
- `http://localhost:3002/health`
- `http://localhost:3003/health`
- `http://localhost:3004/health`

## GitHub Actions CI

Workflow file: `.github/workflows/ci.yml`

On push, it:

- Installs dependencies for each service and frontend
- Builds frontend
- Builds Docker images for all components
- Includes placeholder note for optional registry push

## Cloud Readiness (AWS ECS Friendly)

- Every service reads ports and dependency URLs from environment variables.
- Containers are independent and stateless (in-memory demo data).
- Easy to map each service image into ECS task definitions.

## Important Assignment Note

This project uses in-memory arrays for simplicity, so all data resets on restart. For production, replace with managed persistence (RDS, DynamoDB, etc.).
