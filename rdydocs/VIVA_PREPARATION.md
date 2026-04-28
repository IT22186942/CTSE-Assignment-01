# VIVA PREPARATION - Smart Mall Management System (Microservices)

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture & Design Pattern](#architecture--design-pattern)
3. [Microservices Details](#microservices-details)
4. [Technology Stack & Why](#technology-stack--why)
5. [Security Implementation](#security-implementation)
6. [Inter-Service Communication](#inter-service-communication)
7. [Data Flow & Workflows](#data-flow--workflows)
8. [Containerization (Docker)](#containerization-docker)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Frontend Implementation](#frontend-implementation)
11. [Key Design Decisions](#key-design-decisions)
12. [Expected Viva Questions](#expected-viva-questions)
13. [Demo Scenarios](#demo-scenarios)

---

## PROJECT OVERVIEW

### What is the Project?

A **Smart Mall Management System** built as a **microservices-based cloud application** that demonstrates:

- Distributed system architecture
- Service-to-service communication
- Authentication & Authorization
- API documentation using Swagger/OpenAPI
- Containerization with Docker
- CI/CD integration with GitHub Actions

### Why Microservices?

- **Scalability**: Individual services can scale independently
- **Loose Coupling**: Services are independent and communicate via HTTP
- **Technology Flexibility**: Each service can use different tech stacks
- **Fault Isolation**: If one service fails, others continue functioning
- **Easier Deployment**: Services deployed independently
- **Real-world Industry Standard**: Most modern applications use microservices

### Business Use Case

A mall management system to handle:

- **User Management**: Registration, login, role-based access (admin/student)
- **Contracts**: Users apply for contracts, admins approve them
- **Payments**: Process payments for approved contracts
- **Notifications**: Notify users about contract approvals and payment confirmations

---

## ARCHITECTURE & DESIGN PATTERN

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT/BROWSER                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP/REST
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                        │
│                   Port: 5173 (Nginx)                             │
└──┬──┬──┬──┬────────────────────────────────────────────────────┘
   │  │  │  │
   │  │  │  └─► JWT Token Storage (LocalStorage)
   │  │  │
   │  │  │ API Calls (with Bearer Token)
   │  │  │
   ▼  ▼  ▼  ▼
┌────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                          │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  USER SERVICE    │  │ CONTRACT SERVICE │                    │
│  │  Port: 3001      │  │  Port: 3002      │                    │
│  ├──────────────────┤  ├──────────────────┤                    │
│  │ • Register       │  │ • Apply Contract │                    │
│  │ • Login          │  │ • Get Contracts  │ ──► User Service   │
│  │ • Get User Info  │  │ • Approve        │     (Validation)   │
│  │ • JWT Validate   │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                              │                                   │
│                              │ Send Notification                 │
│                              ▼                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ PAYMENT SERVICE  │  │NOTIFICATION SVC  │                    │
│  │  Port: 3003      │  │  Port: 3004      │                    │
│  ├──────────────────┤  ├──────────────────┤                    │
│  │ • Make Payment   │  │ • Store Notif.   │                    │
│  │ • Get Payments   │  │ • Fetch Notif.   │                    │
│  │ • Validate       │  │ • Log Events     │                    │
│  │   Contract       │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│       │                                                          │
│       │ Validate Contract & Send Notification                   │
│       └─────────────────────────────────────────────────────────│
│                                                                  │
└────────────────────────────────────────────────────────────────┘
         │
         │ In-Memory Storage (Arrays)
         ▼
    [Database Simulation]
```

### Design Pattern: RESTful Microservices

- **REST API**: Each service exposes endpoints that follow HTTP standards
- **Stateless Services**: Services don't store client state; clients send everything needed
- **Service Discovery**: Services know each other via environment variables (URLs)
- **Health Checks**: Docker Compose uses health checks to ensure services are ready
- **API Versioning**: Not needed here, but good practice for future versions

---

## MICROSERVICES DETAILS

### 1. USER SERVICE (Port 3001)

**Purpose**: Handles all user-related operations

#### Endpoints:

| Method | Endpoint              | Auth          | Purpose                                  |
| ------ | --------------------- | ------------- | ---------------------------------------- |
| POST   | `/register`           | None          | Register new user (admin/student)        |
| POST   | `/login`              | None          | Authenticate user, return JWT            |
| GET    | `/users/:id`          | Bearer Token  | Get user info (own or admin)             |
| GET    | `/internal/users/:id` | Service Token | Internal validation (for other services) |
| GET    | `/health`             | None          | Health check for Docker                  |
| GET    | `/api-docs`           | None          | Swagger documentation                    |

#### Key Features:

- **Password Hashing**: Uses `bcryptjs` - passwords never stored plain
- **JWT Authentication**: Issues JWT token valid for 2 hours
- **Role-Based Access**: Admin can view all users, students only their own
- **Email Validation**: Simple regex check for valid format
- **In-Memory Storage**: Users array (simulates database)
- **User Roles**:
  - `admin`: Full access to all resources
  - `student`: Limited to own resources

#### Security Implementation:

```javascript
// Password hashing on registration
const hashedPassword = await bcrypt.hash(password, 10);

// JWT verification on protected routes
app.post("/login", async (req, res) => {
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  // Issue JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "2h" },
  );
});
```

---

### 2. CONTRACT SERVICE (Port 3002)

**Purpose**: Manages contract applications and approvals

#### Endpoints:

| Method | Endpoint                  | Auth          | Purpose                             |
| ------ | ------------------------- | ------------- | ----------------------------------- |
| POST   | `/contracts/apply`        | Bearer Token  | User applies for contract           |
| GET    | `/contracts`              | Bearer Token  | Get user's contracts or all (admin) |
| PUT    | `/contracts/:id/approve`  | Bearer Token  | Admin approves contract             |
| GET    | `/internal/contracts/:id` | Service Token | Internal validation                 |
| GET    | `/health`                 | None          | Health check                        |
| GET    | `/api-docs`               | None          | Swagger docs                        |

#### Key Features:

- **Service-to-Service Call**: Validates user exists in User Service before accepting contract
- **Retry Logic**: Uses `requestWithRetry()` to handle transient failures
- **Status Tracking**: Contracts have PENDING → APPROVED workflow
- **Notifications**: Sends notification to user when contract is approved
- **Authorization**: Only admins can approve contracts

#### Service Communication:

```javascript
// Contract Service calls User Service to validate user
const response = await httpClient.get(
  `${userServiceUrl}/internal/users/${userId}`,
  { headers: { "x-service-token": serviceToken } },
);

// Contract Service calls Notification Service to notify approval
await httpClient.post(
  `${notificationServiceUrl}/notify`,
  {
    userId: contract.userId,
    type: "CONTRACT_APPROVED",
    message: `Your contract "${contract.title}" has been approved.`,
  },
  { headers: { "x-service-token": serviceToken } },
);
```

---

### 3. PAYMENT SERVICE (Port 3003)

**Purpose**: Processes payments for approved contracts

#### Endpoints:

| Method | Endpoint        | Auth         | Purpose                            |
| ------ | --------------- | ------------ | ---------------------------------- |
| POST   | `/payments/pay` | Bearer Token | Process payment for contract       |
| GET    | `/payments`     | Bearer Token | Get user's payments or all (admin) |
| GET    | `/health`       | None         | Health check                       |
| GET    | `/api-docs`     | None         | Swagger docs                       |

#### Key Features:

- **Contract Validation**: Validates contract exists and is APPROVED
- **Business Logic**: Only allows payment for APPROVED contracts
- **Amount Validation**: Amount must be positive
- **User Ownership**: Verifies contract belongs to user making payment
- **Notification**: Sends notification after successful payment
- **Chaining Services**: Depends on Contract Service

#### Business Logic:

```javascript
// Only allow payment for APPROVED contracts
if (contract.status !== "APPROVED") {
  return res.status(400).json({
    message: "Payment allowed only for approved contracts",
  });
}

// Ensure contract belongs to user
if (contract.userId !== userId) {
  return res.status(400).json({
    message: "Contract does not belong to this user",
  });
}
```

---

### 4. NOTIFICATION SERVICE (Port 3004)

**Purpose**: Stores and manages notifications

#### Endpoints:

| Method | Endpoint         | Auth          | Purpose                       |
| ------ | ---------------- | ------------- | ----------------------------- |
| POST   | `/notify`        | Service Token | Store notification (internal) |
| GET    | `/notifications` | Bearer Token  | Fetch notifications for user  |
| GET    | `/health`        | None          | Health check                  |
| GET    | `/api-docs`      | None          | Swagger docs                  |

#### Key Features:

- **Simple Storage**: In-memory array of notifications
- **Notification Types**: `CONTRACT_APPROVED`, `PAYMENT_SUCCESS`
- **Query Filtering**: Get notifications by userId
- **Internal Only**: `/notify` endpoint only accepts internal service calls
- **Audit Trail**: All notifications timestamped

#### Notification Structure:

```javascript
{
  id: "uuid",
  userId: "user-uuid",
  type: "CONTRACT_APPROVED" | "PAYMENT_SUCCESS",
  message: "Your contract has been approved",
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

## TECHNOLOGY STACK & WHY

### Backend: Node.js + Express

**Why Node.js?**

- **JavaScript Everywhere**: Same language for frontend and backend
- **Event-Driven**: Perfect for I/O operations and async handling
- **Fast**: V8 engine compiles to machine code
- **NPM Ecosystem**: Massive library repository
- **Microservices-Friendly**: Lightweight and fast startup
- **Industry Standard**: Used by Netflix, Uber, PayPal, LinkedIn

**Why Express.js?**

- **Minimal Framework**: Only what you need, no bloat
- **Middleware Support**: Easy request/response pipeline
- **Routing**: Simple and intuitive routing system
- **Widely Adopted**: Largest Node.js web framework
- **Learning Curve**: Beginner-friendly

### Frontend: React + Vite

**Why React?**

- **Component-Based**: Reusable UI components
- **Virtual DOM**: Efficient rendering
- **Large Ecosystem**: Numerous libraries and tools
- **Community**: Million developers using it
- **State Management**: Easy to manage UI state

**Why Vite?**

- **Fast Development**: Instant HMR (Hot Module Replacement)
- **Optimized Build**: Faster production builds than Webpack
- **Modern Tooling**: Uses ES modules natively
- **Better DX**: Better developer experience

### Authentication: JWT (JSON Web Tokens)

**Why JWT?**

- **Stateless**: No server-side session storage needed
- **Scalable**: Perfect for microservices
- **Secure**: Uses cryptographic signatures
- **Cross-Platform**: Works everywhere (web, mobile, desktop)
- **Self-Contained**: Token contains user info, no DB lookup needed

### Data Storage: In-Memory Arrays

**Why in-memory?**

- **Assignment Context**: Not production requirement
- **Simplicity**: Easy to understand
- **Fast**: No database latency
- **Data Loss**: Resets on restart (fine for demo)

**Real-World Alternative**: MongoDB, PostgreSQL, MySQL

### Containerization: Docker + Docker Compose

**Why Docker?**

- **Consistency**: "Works on my machine" problem solved
- **Isolation**: Each service independent
- **Portability**: Run anywhere (Windows, Mac, Linux)
- **Scalability**: Easy to scale services
- **Industry Standard**: Used by 99% of companies

**Why Docker Compose?**

- **Multi-Container**: Easily manage multiple services
- **Networking**: Automatic service-to-service networking
- **Health Checks**: Built-in service health monitoring
- **Environment Variables**: Easy configuration management
- **Easy Orchestration**: Simple `docker compose up`

---

## SECURITY IMPLEMENTATION

### 1. **JWT Authentication**

**Flow**:

```
1. User registers/logs in
   ↓
2. Server hashes password with bcrypt
   ↓
3. Server creates JWT with user info
   ↓
4. Client stores token in LocalStorage
   ↓
5. Client sends token in Authorization header for protected routes
   ↓
6. Server verifies token signature
```

**Token Structure** (JWT = header.payload.signature):

```json
{
  "header": { "typ": "JWT", "alg": "HS256" },
  "payload": { "id": "uuid", "email": "user@example.com", "role": "admin" },
  "signature": "cryptographic-signature"
}
```

### 2. **Password Security**

**Implementation**:

- Uses `bcryptjs` library
- Salting: Automatic (salt rounds = 10)
- One-way hashing: Cannot decrypt password
- Comparison: `bcrypt.compare()` verifies without reversing hash

```javascript
// Storage
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 3. **Inter-Service Authentication**

**Method**: `x-service-token` Header

- Services communicate using secret token
- Prevents unauthorized external calls
- Shared across all services via environment variables

```javascript
// Middleware for internal service calls
function internalAuthMiddleware(req, res, next) {
  if (req.headers["x-service-token"] !== serviceToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}
```

### 4. **Authorization (Role-Based Access Control)**

**Levels**:

- **Public**: Health checks, registration, login
- **User**: Own resources (must be logged in)
- **Admin**: All resources

**Examples**:

```javascript
// User can only see own data or admin can see all
if (req.user.role !== "admin" && req.user.id !== userId) {
  return res.status(403).json({ message: "Forbidden" });
}

// Only admin can approve
if (req.user.role !== "admin") {
  return res.status(403).json({ message: "Only admin can approve" });
}
```

### 5. **Input Validation**

**Validation Points**:

- Email format validation
- Password minimum length (6 chars)
- Required fields checking
- Amount validation (must be positive)
- UUID validation

```javascript
function validateEmail(email) {
  return typeof email === "string" && /.+@.+\..+/.test(email);
}

if (!name || !validateEmail(email) || !password || password.length < 6) {
  return res.status(400).json({ message: "Invalid input" });
}
```

### 6. **CORS (Cross-Origin Resource Sharing)**

**Implementation**: `cors()` middleware allows frontend to call backend

```javascript
app.use(cors()); // Enables cross-origin requests
```

### 7. **Environment Variables**

**Security Practice**: Sensitive data in `.env` files

```
JWT_SECRET=super-secret-jwt
SERVICE_TOKEN=internal-service-token
PORT=3001
```

---

## INTER-SERVICE COMMUNICATION

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       SERVICE INTERACTIONS                        │
└──────────────────────────────────────────────────────────────────┘

CONTRACT SERVICE                    USER SERVICE
    │                                   ▲
    │ (1) GET /internal/users/:id       │
    │     x-service-token               │ Returns: { valid: true, user: {...} }
    └──────────────────────────────────►│

    After validation:

CONTRACT SERVICE                    NOTIFICATION SERVICE
    │                                   ▲
    │ (2) POST /notify                  │
    │     type: "CONTRACT_APPROVED"     │ Returns: { id, notification }
    └──────────────────────────────────►│


PAYMENT SERVICE                    CONTRACT SERVICE
    │                                   ▲
    │ (1) GET /internal/contracts/:id   │
    │     x-service-token               │ Returns: { valid: true, contract: {...} }
    └──────────────────────────────────►│

    After validation:

PAYMENT SERVICE                    NOTIFICATION SERVICE
    │                                   ▲
    │ (2) POST /notify                  │
    │     type: "PAYMENT_SUCCESS"       │ Returns: { id, notification }
    └──────────────────────────────────►│
```

### Communication Protocol

**Base URL Formation**:

```javascript
// From environment variable
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";

// Inside Docker Compose
// Services communicate using service names (automatic DNS resolution)
const userServiceUrl = "http://user-service:3001";
```

### Retry Logic (Resilience)

**Why Retry?**

- Services might not be ready immediately
- Transient network failures
- Temporary service overload

**Implementation**:

```javascript
async function requestWithRetry(requestFn, retries = 2, delayMs = 500) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// Usage
await requestWithRetry(() =>
  httpClient.get(`${userServiceUrl}/internal/users/${userId}`, {
    headers: { "x-service-token": serviceToken },
  }),
);
```

### Error Handling

**Timeout Configuration**:

```javascript
const httpClient = axios.create({ timeout: 3000 }); // 3 second timeout
```

**Graceful Degradation**:

- If notification fails, payment still succeeds (not critical)
- If validation fails, operation rejected (critical)

---

## DATA FLOW & WORKFLOWS

### Workflow 1: User Registration & Login

```
Step 1: User Registers
  Input: { name, email, password, role }
  ↓
  User Service validates input
  ↓
  User Service checks if email already exists
  ↓
  User Service hashes password
  ↓
  User Service stores in users array
  ↓
  Response: { message, user }

Step 2: User Login
  Input: { email, password }
  ↓
  User Service finds user by email
  ↓
  User Service compares password hash
  ↓
  User Service generates JWT token (2 hour expiry)
  ↓
  Response: { token, user }
  ↓
  Frontend stores token in LocalStorage
  ↓
  Frontend includes token in all subsequent requests
```

### Workflow 2: Contract Application & Approval

```
Step 1: User Applies for Contract (Frontend → Contract Service)
  Input: { userId, title, details }
  Header: Authorization: Bearer {JWT_TOKEN}
  ↓
  Contract Service checks auth (JWT validation)
  ↓
  Contract Service validates user authorization
  ↓
  Contract Service calls User Service
    GET /internal/users/{userId}
    Header: x-service-token
  ↓
  User Service validates user exists
  ↓
  Contract Service creates contract with PENDING status
  ↓
  Response: { message, contract }


Step 2: Admin Approves Contract (Frontend → Contract Service)
  Input: { contractId }
  Header: Authorization: Bearer {JWT_TOKEN}
  ↓
  Contract Service checks auth (JWT validation)
  ↓
  Contract Service checks role (must be admin)
  ↓
  Contract Service updates contract status to APPROVED
  ↓
  Contract Service calls Notification Service
    POST /notify
    Body: { userId, type: "CONTRACT_APPROVED", message }
    Header: x-service-token
  ↓
  Notification Service stores notification
  ↓
  Response includes notification confirmation
```

### Workflow 3: Payment Processing

```
Step 1: User Makes Payment (Frontend → Payment Service)
  Input: { contractId, amount, userId }
  Header: Authorization: Bearer {JWT_TOKEN}
  ↓
  Payment Service checks auth
  ↓
  Payment Service validates auth
  ↓
  Payment Service calls Contract Service
    GET /internal/contracts/{contractId}
    Header: x-service-token
  ↓
  Contract Service validates contract exists and is APPROVED
  ↓
  Payment Service verifies contract belongs to user
  ↓
  Payment Service verifies amount > 0
  ↓
  Payment Service creates payment record with PAID status
  ↓
  Payment Service calls Notification Service
    POST /notify
    Body: { userId, type: "PAYMENT_SUCCESS", message }
    Header: x-service-token
  ↓
  Notification Service stores notification
  ↓
  Response: { message, payment }


Step 2: User Fetches Notifications (Frontend → Notification Service)
  Query: GET /notifications?userId={userId}
  Header: Authorization: Bearer {JWT_TOKEN}
  ↓
  Notification Service checks auth
  ↓
  Notification Service filters notifications for userId
  ↓
  Response: [ { id, userId, type, message, createdAt }, ... ]
```

---

## CONTAINERIZATION (DOCKER)

### What is Docker?

**Analogy**:

- Traditional VM: Entire computer + OS inside container
- Docker: Only application + dependencies inside container
- Lighter weight, faster startup, easier deployment

### Dockerfile Structure

```dockerfile
# user-service/Dockerfile

FROM node:20
# Use Node.js 20 image as base

WORKDIR /app
# Set working directory inside container

COPY package*.json ./
# Copy package.json and package-lock.json

RUN npm install
# Install dependencies

COPY . .
# Copy application code

EXPOSE 3001
# Expose port (documentation only)

CMD ["node", "src/index.js"]
# Run the application
```

### Docker Compose Orchestration

**Why Docker Compose?**

- Define all services in one file
- Automatic networking between services
- Health checks and dependency management
- Environment variable management
- One command to start everything

**Key Configuration Elements**:

```yaml
version: "3.8"

services:
  user-service:
    build: ./user-service
    # Build Docker image from Dockerfile

    container_name: user-service
    # Container name

    environment:
      PORT: 3001
      JWT_SECRET: super-secret-jwt
      SERVICE_TOKEN: internal-service-token
    # Environment variables

    ports:
      - "3001:3001"
    # Map port 3001 (host) to 3001 (container)

    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health')..."]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    # Health check to ensure service is running

  contract-service:
    depends_on:
      user-service:
        condition: service_healthy
    # Wait for user-service to be healthy before starting
```

### Networking in Docker Compose

**Automatic DNS Resolution**:

```javascript
// Inside container
process.env.USER_SERVICE_URL = "http://user-service:3001";
// "user-service" is automatically resolved to the container IP
```

**Host vs Container Networking**:

- Host port 3001 → Container port 3001 (for external access)
- Container-to-container uses service name (no port mapping needed)

### Commands

```bash
# Build images and start containers
docker compose up --build

# Start in background
docker compose up --build -d

# Stop containers
docker compose down

# View running containers
docker compose ps

# View logs
docker compose logs -f  # Follow logs
docker compose logs user-service  # Specific service
```

---

## CI/CD PIPELINE

### GitHub Actions Workflow

**Purpose**: Automated testing and building on every push

**File**: `.github/workflows/ci.yml`

### Workflow Steps

```yaml
name: Smart Mall CI

on:
  push:
    branches:
      - "**" # Run on all branches
  # Triggers on every push

jobs:
  install-and-build:
    runs-on: ubuntu-latest
    # Run on Ubuntu VM (GitHub's servers)

    strategy:
      matrix:
        service:
          - user-service
          - contract-service
          - payment-service
          - notification-service
          - frontend
    # Run steps for each service

    steps:
      - name: Checkout
        uses: actions/checkout@v4
      # Clone repository

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      # Install Node.js

      - name: Install dependencies
        run: npm install
        working-directory: ${{ matrix.service }}
      # Run npm install in each service

      - name: Build frontend
        if: matrix.service == 'frontend'
        run: npm run build
        working-directory: frontend
      # Build React app (production optimized)

  docker-build:
    runs-on: ubuntu-latest
    needs: install-and-build
    # Wait for install-and-build to complete

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build Docker images
        run: |
          docker build -t smart-mall-user-service ./user-service
          docker build -t smart-mall-contract-service ./contract-service
          docker build -t smart-mall-payment-service ./payment-service
          docker build -t smart-mall-notification-service ./notification-service
      # Build Docker images for all services
```

### Why CI/CD?

1. **Automated Testing**: Code is tested automatically
2. **Early Bug Detection**: Issues caught before deployment
3. **Consistency**: Same build process every time
4. **Fast Feedback**: Developers know immediately if code breaks
5. **Quality Gate**: Prevents broken code from merging

### Deployment To Azure (Planned, Not Completed)

Azure deployment was planned, but I could not complete it because of subscription limitations. During viva, I will show the working local prototype and the GitHub Actions build run instead.

**Steps to Deploy**:

1. Push Docker images to Azure Container Registry
2. Create Azure Container Instances for each service
3. Set up networking between instances
4. Configure DNS and load balancing
5. Scale services based on demand

### What I Can Show in Viva Instead

- Working Docker Compose prototype
- Swagger/OpenAPI docs for each service
- GitHub Actions workflow run
- Service-to-service communication logs
- Security and token flow

---

## FRONTEND IMPLEMENTATION

### React + Vite Structure

**Why This Stack?**

- React: Component-based UI
- Vite: Lightning-fast development and builds
- Axios: HTTP client for API calls

### API Integration (`src/api.js`)

```javascript
// Separate axios instances for each service
const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:3001",
});

// Interceptor to auto-attach JWT token
function attachToken(config) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

userApi.interceptors.request.use(attachToken);
```

**Why Interceptors?**

- Automatic token attachment to every request
- DRY (Don't Repeat Yourself)
- Centralized authentication logic

### Frontend Pages (Components)

1. **Auth Pages**
   - Registration/Login forms
   - Input validation
   - Token storage

2. **Dashboard Pages**
   - Contract management
   - Payment processing
   - Notification display

3. **Admin Pages**
   - Approve contracts
   - View all users/contracts/payments

### Build Process

```bash
npm run build
# Creates optimized production build
# Minified JavaScript
# Optimized CSS
# Compressed assets
```

**Build Output**: `dist/` folder with static files served by Nginx

---

## KEY DESIGN DECISIONS

### Why I Chose This Architecture

| Decision              | Why                                                        |
| --------------------- | ---------------------------------------------------------- |
| **Microservices**     | Scalable, loosely coupled, fault isolated                  |
| **REST API**          | Industry standard, easy to understand, widely supported    |
| **JWT**               | Stateless, scalable, perfect for microservices             |
| **Docker Compose**    | Simple to set up, great for local dev + demo               |
| **In-Memory Storage** | Fast, simple for assignment, can be replaced with DB       |
| **Health Checks**     | Ensures services are ready before dependencies start       |
| **Retry Logic**       | Handles transient failures gracefully                      |
| **Service Token**     | Prevents unauthorized external calls to internal endpoints |
| **Swagger/OpenAPI**   | Self-documenting APIs, easy to understand                  |
| **GitHub Actions**    | Free CI/CD, integrates with GitHub, good for learning      |

### Trade-offs Made

| Aspect                 | Current Approach      | Why          | Production Alternative |
| ---------------------- | --------------------- | ------------ | ---------------------- |
| **Storage**            | In-Memory Arrays      | Simple, fast | MongoDB, PostgreSQL    |
| **Service Discovery**  | Environment Variables | Simple       | Consul, Kubernetes DNS |
| **Inter-Service Auth** | Shared Token          | Simple       | OAuth2, mTLS           |
| **Logging**            | Console logs          | Simple       | ELK Stack, CloudWatch  |
| **Monitoring**         | Docker health checks  | Simple       | Prometheus, Datadog    |
| **API Gateway**        | Direct calls          | Simple       | Kong, AWS API Gateway  |

---

## EXPECTED VIVA QUESTIONS

### Basic Questions

**Q1: What is a microservice?**

> A: An independent service that does one thing well. In our system, each service (user, contract, payment, notification) handles its specific domain. They communicate via HTTP, scale independently, and can be deployed separately.

**Q2: Why did you use microservices instead of a monolith?**

> A:
>
> - Scalability: If contracts become popular, I scale only contract service
> - Resilience: If payment service crashes, others keep working
> - Team Structure: Different teams can work on different services
> - Technology Flexibility: Each service can use different tech
> - Easier Deployment: Deploy individual services without restarting all

**Q3: What are the ports for each service?**

> A:
>
> - User Service: 3001
> - Contract Service: 3002
> - Payment Service: 3003
> - Notification Service: 3004
> - Frontend: 5173

**Q4: How does authentication work?**

> A:
>
> 1. User registers/logs in to User Service
> 2. User Service hashes password and stores in memory
> 3. User Service creates JWT token
> 4. Client stores token in localStorage
> 5. Client includes token in header for protected routes
> 6. Services verify token signature

**Q5: What's the purpose of JWT?**

> A:
>
> - Stateless authentication (no server session storage)
> - Prevents unauthorized access
> - Contains user info (id, email, role)
> - Expires after 2 hours
> - Cryptographically signed

---

### Architecture Questions

**Q6: How do services communicate with each other?**

> A: Via HTTP REST API calls using Axios library. For example:
>
> - Contract Service calls User Service to validate user
> - Payment Service calls Contract Service to validate contract
> - Both call Notification Service to send notifications

**Q7: What's the difference between Bearer token and x-service-token?**

> A:
>
> - **Bearer Token (JWT)**: For client-to-service authentication
>   - User sends in Authorization header
>   - Contains user info (id, email, role)
>   - Expires after 2 hours
> - **x-service-token**: For service-to-service authentication
>   - Services send in x-service-token header
>   - Shared secret token
>   - Never expires
>   - Prevents external unauthorized calls

**Q8: What does the health check do?**

> A: Docker Compose uses health checks to:
>
> - Verify each service is running
> - Prevent dependent services from starting too early
> - For example, contract-service waits for user-service to be healthy
> - Checks `/health` endpoint every 10 seconds

**Q9: How would you add a database to this system?**

> A:
>
> 1. Replace in-memory arrays with database queries
> 2. Add database connection string to environment variables
> 3. Use ODM/ORM library (Mongoose for MongoDB, Sequelize for SQL)
> 4. Add database service to docker-compose.yml
> 5. Add health check for database
> 6. Example for MongoDB:
>    ```javascript
>    const user = await User.findById(userId);
>    const user2 = new User({ name, email, role });
>    await user2.save();
>    ```

**Q10: What happens if a service fails?**

> A:
>
> - **If User Service fails**: Contract/Payment operations fail (depends on it)
> - **If Notification Service fails**: Notifications aren't stored but operations continue
> - **If Contract Service fails**: Payments can't be processed
> - **In Production**: Use API Gateway, circuit breaker, fallback strategies

---

### Technical Questions

**Q11: Why use bcrypt for password hashing?**

> A:
>
> - One-way hashing: Cannot decrypt to get original password
> - Salting: Adds random data, prevents rainbow table attacks
> - Slowing down: 10 rounds makes it computationally expensive to brute force
> - Industry Standard: Used by 99% of companies

**Q12: Explain the contract workflow**

> A:
>
> 1. User applies for contract with Bearer token
> 2. Contract Service validates user exists (calls User Service)
> 3. Contract created with PENDING status
> 4. Admin approves via PUT /contracts/:id/approve
> 5. Contract Service notifies user (calls Notification Service)
> 6. Status changes to APPROVED
> 7. User can now make payment

**Q13: Why do you retry service calls?**

> A:
>
> - Services might not be ready immediately at startup
> - Network timeouts can be temporary
> - Transient failures happen in distributed systems
> - Retry with exponential backoff improves resilience
> - 2 retries with 500ms delay gives enough time to reconnect

**Q14: How does role-based access control work?**

> A:
>
> - JWT token contains user's role (admin/student)
> - Middleware checks role on protected routes
> - Example: Only admins can approve contracts
>
> ```javascript
> if (req.user.role !== "admin") {
>   return res.status(403).json({ message: "Forbidden" });
> }
> ```

**Q15: What's inside a JWT token?**

> A: Three parts separated by dots (header.payload.signature):
>
> - **Header**: Token type and algorithm
> - **Payload**: User info (id, email, role) - Base64 encoded (not encrypted!)
> - **Signature**: HMAC-SHA256 hash to prevent tampering
> - Example: eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoiYUBhLmNvbSJ9.signature

---

### DevOps Questions

**Q16: What does docker-compose.yml do?**

> A:
>
> - Defines all services in one file
> - Configures environment variables
> - Maps ports
> - Sets up service dependencies
> - Configures health checks
> - One `docker compose up` starts everything

**Q17: How does Docker networking work?**

> A:
>
> - Automatic network created for containers
> - Service names resolve to container IPs
> - Inside container: `http://user-service:3001`
> - From outside (host): `http://localhost:3001`
> - No need to know container IPs

**Q18: What's the difference between EXPOSE and ports mapping?**

> A:
>
> - **EXPOSE**: Documentation in Dockerfile, doesn't actually open port
> - **ports**: In docker-compose.yml, maps host:container ports
> - Example:
>   ```yaml
>   EXPOSE 3001  # Documentation
>   ports:
>     - "3001:3001"  # Actually opens port
>   ```

**Q19: What's the advantage of Docker Compose over running containers manually?**

> A:
>
> - One command to start all services instead of 4 separate Docker commands
> - Automatic networking instead of manual network setup
> - Health checks ensure service readiness
> - Environment variables centralized instead of scattered
> - Easy to manage dependencies
> - Easy to scale services

**Q20: How would you deploy this to Azure?**

> A:
>
> Azure deployment was my planned next step, but it was not completed because of subscription limitations. The intended flow would be:
>
> 1. Push Docker images to Azure Container Registry
> 2. Create Azure Container Instances or Azure Container Apps for each service
> 3. Set up Azure Virtual Network for service communication
> 4. Configure Azure Application Gateway for frontend exposure
> 5. Set up Azure SQL or Azure Cosmos DB for persistence
> 6. Configure auto-scaling based on metrics
> 7. Set up monitoring with Azure Monitor
>
> In viva, I will demonstrate the local deployment and GitHub Actions build instead.

---

### Scenario-Based Questions

**Q21: User registers but the database goes down. What happens?**

> A:
>
> - Currently: Users array is in-memory, resets on restart
> - Better response: "Data loss occurs on restart, use database"
> - In production: Database would be persistent
> - Could add: Backup/restore mechanism

**Q22: Contract Service can't reach User Service. What happens?**

> A:
>
> - Contract application fails with "User validation failed"
> - Retry logic attempts 2 more times with 500ms delay
> - If all retries fail, user gets error message
> - User instructs to try again
> - Better approach: Circuit breaker pattern (fail fast)

**Q23: Admin approves contract but notification doesn't send. What happens?**

> A:
>
> - Contract status still changes to APPROVED (good!)
> - User doesn't get notified (bad)
> - But contract can still be paid for
> - Better approach: Use message queue (RabbitMQ, Kafka)
> - Ensures notification is eventually sent

**Q24: How would you handle 1 million users?**

> A:
>
> - Load Balancer: Distribute traffic to multiple service instances
> - Database: Switch from in-memory to MongoDB/PostgreSQL
> - Caching: Use Redis for frequently accessed data
> - Message Queue: Use Kafka/RabbitMQ for notifications
> - API Gateway: Rate limiting, request throttling
> - CDN: Serve frontend from global edge locations
> - Monitoring: Track performance and bottlenecks

**Q25: How would you prevent SQL injection?**

> A:
>
> - Currently: In-memory storage, not applicable
> - In production: Use ORM/ODM (Mongoose, Sequelize)
> - Never concatenate SQL: `SELECT * FROM users WHERE id = ${id}` ❌
> - Always parameterize: `db.query("SELECT * FROM users WHERE id = ?", [id])` ✅
> - Mongoose automatically parameterizes queries

---

### Concept Questions

**Q26: What's the CAP theorem?**

> A: Trade-off in distributed systems:
>
> - **Consistency**: All nodes see same data
> - **Availability**: System always responds
> - **Partition Tolerance**: System continues despite network failure
> - Can have maximum 2 of 3
> - Our system: Chooses Availability and Partition tolerance (AP)

**Q27: Explain eventually consistent vs strong consistent**

> A:
>
> - **Strong Consistent**: Updates visible immediately to all (expensive)
> - **Eventually Consistent**: Updates take time to propagate (fast)
> - Our system: Eventually consistent
> - If payment service caches contract status, might not see latest

**Q28: What's asynchronous vs synchronous communication?**

> A:
>
> - **Synchronous**: Caller waits for response (HTTP REST calls)
>   - Used: Contract validation
>   - Pros: Simple, immediate feedback
>   - Cons: Blocked if service slow
> - **Asynchronous**: Caller doesn't wait (Message Queues)
>   - Use case: Notifications
>   - Pros: Scalable, decoupled
>   - Cons: More complex

**Q29: What's an API Gateway?**

> A: Single entry point for all client requests:
>
> - Routes requests to appropriate service
> - Rate limiting (prevent abuse)
> - Authentication/Authorization
> - Logging and monitoring
> - Load balancing
> - Example: Kong, AWS API Gateway

**Q30: What's service discovery?**

> A: How services find each other:
>
> - **Current**: Hardcoded URLs in environment variables
> - **Better**: Service registry (like Consul, Eureka)
> - Service registers itself with registry
> - Other services query registry for locations
> - Handles dynamic IPs, service migration

---

## DEMO SCENARIOS

### Demo Scenario 1: Complete User Journey

**Setup**: `docker compose up --build`

**Steps**:

1. **Register User**

   ```bash
   curl -X POST http://localhost:3001/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "password123",
       "role": "student"
     }'
   ```

   Expected: User created, ID returned

2. **Login**

   ```bash
   curl -X POST http://localhost:3001/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "password123"
     }'
   ```

   Expected: JWT token returned
   Save token: `export TOKEN="eyJhbGc..."`

3. **Apply for Contract**

   ```bash
   curl -X POST http://localhost:3002/contracts/apply \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "userId": "<USER_ID>",
       "title": "Internship Contract",
       "details": "6-month internship"
     }'
   ```

   Expected: Contract created with PENDING status
   Save contract ID: `export CONTRACT_ID="..."`

4. **Register Admin & Approve Contract**

   ```bash
   # Register admin
   curl -X POST http://localhost:3001/register \
     -d '{
       "name": "Admin",
       "email": "admin@example.com",
       "password": "admin123",
       "role": "admin"
     }'

   # Login as admin
   curl -X POST http://localhost:3001/login \
     -d '{
       "email": "admin@example.com",
       "password": "admin123"
     }'
   # Save admin token: export ADMIN_TOKEN="..."

   # Approve contract
   curl -X PUT http://localhost:3002/contracts/$CONTRACT_ID/approve \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

   Expected: Contract status changes to APPROVED

5. **Check Notifications**

   ```bash
   curl -X GET "http://localhost:3004/notifications?userId=<USER_ID>" \
     -H "Authorization: Bearer $TOKEN"
   ```

   Expected: CONTRACT_APPROVED notification appears

6. **Make Payment**

   ```bash
   curl -X POST http://localhost:3003/payments/pay \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "contractId": "'$CONTRACT_ID'",
       "amount": 5000,
       "userId": "<USER_ID>"
     }'
   ```

   Expected: Payment created with PAID status

7. **Check Notifications Again**
   ```bash
   curl -X GET "http://localhost:3004/notifications?userId=<USER_ID>" \
     -H "Authorization: Bearer $TOKEN"
   ```
   Expected: PAYMENT_SUCCESS notification added

---

### Demo Scenario 2: Error Handling

**1. Invalid Email Registration**

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "invalid-email",
    "password": "pass"
  }'
```

Expected: 400 Bad Request - "Invalid input"

**2. Duplicate Email**

```bash
# First registration succeeds
curl -X POST http://localhost:3001/register \
  -d '{"name": "User1", "email": "test@test.com", "password": "pass123"}'

# Second registration with same email
curl -X POST http://localhost:3001/register \
  -d '{"name": "User2", "email": "test@test.com", "password": "pass123"}'
```

Expected: 409 Conflict - "Email already registered"

**3. Invalid Token**

```bash
curl -X GET http://localhost:3001/users/some-id \
  -H "Authorization: Bearer invalid-token"
```

Expected: 401 Unauthorized - "Invalid or expired token"

**4. Unauthorized Payment (Not Approved Contract)**

```bash
# Try to pay for contract without approving first
curl -X POST http://localhost:3003/payments/pay \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "contractId": "'$PENDING_CONTRACT'",
    "amount": 1000,
    "userId": "<USER_ID>"
  }'
```

Expected: 400 Bad Request - "Payment allowed only for approved contracts"

**5. Only Admin Can Approve**

```bash
curl -X PUT http://localhost:3002/contracts/$CONTRACT_ID/approve \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

Expected: 403 Forbidden - "Only admin can approve contracts"

---

### Demo Scenario 3: Docker Compose Features

**1. Service Health Checks**

```bash
docker compose ps
```

Shows health status of all services

**2. View Logs**

```bash
# All services
docker compose logs

# Specific service with follow
docker compose logs -f contract-service

# Last 50 lines
docker compose logs --tail=50
```

**3. Restart a Service**

```bash
docker compose restart contract-service
# Notice: Other services continue running
# Demonstrates isolation
```

**4. Stop and Start**

```bash
# Stop all
docker compose down

# Start again
docker compose up --build
```

**5. Scale Services** (Advanced)

```bash
# With Docker Compose v3 limitation, scaling needs manual setup
# But demonstrates concept:
docker compose up --scale payment-service=3
# Would run 3 instances of payment service
# (Load balancer needed for request distribution)
```

---

### Demo Script

**Create `demo.sh`**:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=== Smart Mall Management System Demo ==="
echo ""

# USER REGISTRATION
echo -e "${GREEN}1. Registering student user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@mall.com",
    "password": "secure123",
    "role": "student"
  }')

STUDENT_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
echo "Student registered: $STUDENT_ID"
echo ""

# USER LOGIN
echo -e "${GREEN}2. Login student...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@mall.com",
    "password": "secure123"
  }')

STUDENT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: ${STUDENT_TOKEN:0:20}..."
echo ""

# CONTRACT APPLICATION
echo -e "${GREEN}3. Apply for contract...${NC}"
CONTRACT_RESPONSE=$(curl -s -X POST http://localhost:3002/contracts/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "userId": "'$STUDENT_ID'",
    "title": "Internship Agreement",
    "details": "6-month paid internship at Smart Mall"
  }')

CONTRACT_ID=$(echo $CONTRACT_RESPONSE | jq -r '.contract.id')
echo "Contract applied: $CONTRACT_ID"
echo ""

# ADMIN REGISTRATION & LOGIN
echo -e "${GREEN}4. Admin registration and login...${NC}"
curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@mall.com",
    "password": "admin123",
    "role": "admin"
  }' > /dev/null

ADMIN_LOGIN=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mall.com",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.token')
echo "Admin token: ${ADMIN_TOKEN:0:20}..."
echo ""

# APPROVE CONTRACT
echo -e "${GREEN}5. Admin approves contract...${NC}"
curl -s -X PUT http://localhost:3002/contracts/$CONTRACT_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

# FETCH NOTIFICATIONS
echo -e "${GREEN}6. Checking notifications...${NC}"
curl -s -X GET "http://localhost:3004/notifications?userId=$STUDENT_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
echo ""

# MAKE PAYMENT
echo -e "${GREEN}7. Making payment...${NC}"
PAYMENT=$(curl -s -X POST http://localhost:3003/payments/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "contractId": "'$CONTRACT_ID'",
    "amount": 50000,
    "userId": "'$STUDENT_ID'"
  }')

echo $PAYMENT | jq .
echo ""

# FINAL NOTIFICATIONS
echo -e "${GREEN}8. Final notifications list...${NC}"
curl -s -X GET "http://localhost:3004/notifications?userId=$STUDENT_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .

echo ""
echo -e "${GREEN}Demo completed successfully!${NC}"
```

**Run**: `bash demo.sh`

---

## QUICK REFERENCE

### Project Structure

```
root/
├── user-service/              # User authentication
│   ├── src/index.js          # Main service
│   ├── src/openapi.js        # Swagger spec
│   ├── Dockerfile            # Docker config
│   └── package.json          # Dependencies
├── contract-service/          # Contract management
├── payment-service/           # Payment processing
├── notification-service/      # Notification storage
├── frontend/                  # React UI
├── .github/workflows/ci.yml   # GitHub Actions CI/CD
├── docker-compose.yml         # Docker orchestration
└── README.md                  # Documentation
```

### Key Commands

```bash
# Development
docker compose up --build       # Start all services
docker compose down             # Stop all services
docker compose logs -f          # View live logs
docker compose ps              # Check service status

# API Testing
curl -X POST http://localhost:3001/register    # Register
curl -X POST http://localhost:3001/login       # Login
curl -X GET http://localhost:3001/api-docs    # API docs

# Deployment (Future)
docker push registry.azure.com/smartmall/*    # Push to Azure
az container create ...                         # Deploy to Azure
```

### Default Credentials (Demo)

- **Ports**: 3001-3004 (services), 5173 (frontend)
- **JWT Secret**: `super-secret-jwt`
- **Service Token**: `internal-service-token`
- **Token Expiry**: 2 hours

---

## SUMMARY

### What You've Built

A production-like microservices application demonstrating:

- ✅ Distributed system architecture
- ✅ Service-to-service communication
- ✅ JWT-based authentication
- ✅ Role-based authorization
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ✅ API documentation (Swagger)
- ✅ Error handling and resilience

### Why It Matters

- **Industry Relevant**: Real companies use this architecture
- **Scalable**: Can scale to millions of users
- **Maintainable**: Services are independent and easy to modify
- **Deployable**: Ready for cloud platforms
- **Learning**: Understands distributed systems concepts

### Next Steps (If Azure Access Is Available)

1. Set up Azure Container Registry
2. Push Docker images
3. Create Azure Container Instances
4. Configure networking
5. Set up monitoring and alerting

### Viva Demonstration Plan

1. Show local Docker Compose run
2. Open Swagger docs
3. Show GitHub Actions workflow
4. Show inter-service flow using curl
5. Explain Azure deployment plan verbally

---

**Good luck with your viva!** 🎯
