# VIVA QUICK REFERENCE GUIDE

## 📋 ONE-PAGE PROJECT SUMMARY

### What?

Smart Mall Management System - A **microservices-based cloud application** with 4 backend services + React frontend

### Why?

- Demonstrate distributed systems architecture
- Learn cloud computing concepts
- Industry-standard technology stack

### How?

- Built with: Node.js, Express, React, Docker
- Deployed with: Docker Compose (local), GitHub Actions CI build
- Azure deployment not completed due subscription limitation

---

## 🏗️ ARCHITECTURE AT A GLANCE

```
USER → FRONTEND (React)
  ↓
[SERVICE LAYER - 4 MICROSERVICES]
  1. User Service (Port 3001) - Auth
  2. Contract Service (Port 3002) - Contracts
  3. Payment Service (Port 3003) - Payments
  4. Notification Service (Port 3004) - Notifications
  ↓
[IN-MEMORY STORAGE]
  Arrays simulating database
```

---

## 🔐 SECURITY LAYERS

### Layer 1: Public Endpoints (No Auth)

- `/register` - User registration
- `/login` - User login
- `/health` - Service health check
- `/api-docs` - Swagger documentation

### Layer 2: User Authentication (Bearer Token)

- JWT token issued on login
- Stored in frontend localStorage
- Sent in Authorization header
- Verified by services

### Layer 3: Service Authorization

- Role checking: admin vs student
- User ownership verification
- Resource access control

### Layer 4: Internal Service Auth (x-service-token)

- Service-to-service calls
- Shared secret token
- Prevents external unauthorized calls

---

## 🔄 MAIN WORKFLOWS

### Workflow 1: Registration & Login

```
User enters credentials
    ↓
User Service validates
    ↓
Password hashed & stored
    ↓
JWT issued (2 hour expiry)
    ↓
Frontend stores in localStorage
    ↓
Included in all future requests
```

### Workflow 2: Contract Apply & Approve

```
Student applies for contract
    ↓
Contract Service calls User Service (validate user exists)
    ↓
Contract created with PENDING status
    ↓
Admin approves
    ↓
Contract Service calls Notification Service
    ↓
Status changes to APPROVED
    ↓
Student receives notification
```

### Workflow 3: Payment & Notification

```
Student initiates payment
    ↓
Payment Service calls Contract Service (verify APPROVED)
    ↓
Amount validated
    ↓
Payment recorded as PAID
    ↓
Payment Service calls Notification Service
    ↓
Student receives payment confirmation
```

---

## 💡 KEY CONCEPTS

### Microservices

- Independent services (can fail separately)
- Communicate via HTTP/REST
- Scale independently
- Own data storage

### JWT (JSON Web Tokens)

- **Structure**: header.payload.signature
- **Stateless**: No server-side session
- **Secure**: Cryptographically signed
- **Scalable**: Perfect for microservices

### Docker

- **Container**: Isolated application + dependencies
- **Image**: Blueprint for container
- **Compose**: Multi-container orchestration

### REST API

- **POST** - Create resource
- **GET** - Retrieve resource
- **PUT** - Update resource
- **DELETE** - Remove resource

---

## 🎯 EXPECTED VIVA QUESTIONS & QUICK ANSWERS

### Q: What is this project?

A: Microservices-based Smart Mall Management System with 4 independent services for user management, contracts, payments, and notifications. Built with Node.js, Express, React, and Docker.

### Q: Why microservices?

A: Scalability (scale individual services), resilience (service failure isolated), team flexibility, technology flexibility, easier deployment.

### Q: How many services and what are they?

A: 4 services:

1. User Service (3001) - Authentication & authorization
2. Contract Service (3002) - Contract management
3. Payment Service (3003) - Payment processing
4. Notification Service (3004) - Notification storage

### Q: How do services communicate?

A: Via HTTP REST API using Axios. With retry logic (2 retries, 500ms delay) for resilience. Using x-service-token header for authentication.

### Q: What are the two types of authentication?

A:

1. Bearer Token (JWT) - Client to service, contains user info
2. x-service-token - Service to service, shared secret

### Q: What's JWT used for?

A: Stateless authentication. User registers/logs in, gets token, sends token in requests. No server-side session needed.

### Q: How is password stored?

A: Hashed using bcryptjs with 10 salt rounds. Never stored in plain text. Verified using bcrypt.compare() during login.

### Q: What does Docker Compose do?

A: Orchestrates multiple containers. Defines services, environment variables, port mappings, health checks, and dependencies in one file.

### Q: How does CI/CD work?

A: GitHub Actions runs on every push. It installs dependencies, builds code, and builds Docker images. I can show the workflow run in viva. Deployment to Azure was planned but not completed due subscription limitations.

### Q: What's in-memory storage?

A: Data stored in JavaScript arrays. Lost on restart. Used for simplicity in assignment. Production would use database.

### Q: What if a service fails?

A:

- User Service: Contract/Payment operations fail
- Notification Service: Operations continue but no notifications
- Contract Service: Payments can't process
- Retry logic helps but not foolproof

### Q: Difference between EXPOSE and ports mapping?

A:

- EXPOSE: Documentation only in Dockerfile
- ports: Actually opens the port in docker-compose.yml

### Q: How would you scale this to 1M users?

A: Load balancers, database replacement, caching (Redis), message queues (Kafka), API gateway, monitoring, CDN for frontend.

### Q: How would you deploy to Azure?

A: Push images to Azure Container Registry, create Container Instances, set up Virtual Network, configure Azure SQL/Cosmos DB, scale based on metrics.

### Q: What's the CAP theorem?

A: Trade-off in distributed systems. Can have max 2 of 3:

- Consistency (all see same data)
- Availability (always responds)
- Partition Tolerance (works despite network issues)

Our system: AP (Availability + Partition Tolerance)

### Q: What would break if authentication was removed?

A: Anyone could access any user's data, admins could approve contracts without verification, payments could be made without proper authorization, security would be completely compromised.

---

## 📊 DATA STRUCTURES

### User Object

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed-password",
  "role": "admin|student"
}
```

### Contract Object

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Contract Title",
  "details": "Contract details",
  "status": "PENDING|APPROVED",
  "createdAt": "ISO-8601-timestamp",
  "approvedAt": "ISO-8601-timestamp|null"
}
```

### Payment Object

```json
{
  "id": "uuid",
  "contractId": "uuid",
  "userId": "uuid",
  "amount": 5000,
  "status": "PAID",
  "createdAt": "ISO-8601-timestamp"
}
```

### Notification Object

```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "CONTRACT_APPROVED|PAYMENT_SUCCESS",
  "message": "Notification message",
  "createdAt": "ISO-8601-timestamp"
}
```

---

## 🚀 QUICK START COMMANDS

```bash
# Start everything
docker compose up --build

# Stop everything
docker compose down

# View service status
docker compose ps

# View logs
docker compose logs -f service-name

# Test endpoints
curl -X POST http://localhost:3001/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","password":"pass123","role":"student"}'

# View Swagger docs
http://localhost:3001/api-docs
http://localhost:3002/api-docs
http://localhost:3003/api-docs
http://localhost:3004/api-docs
```

---

## ⚠️ COMMON VIVA PITFALLS TO AVOID

### ❌ Don't Say

- "It's just a Node.js app"
- "JWT stores user data encrypted"
- "If User Service fails, the system continues normally"
- "In-memory storage is production-ready"
- "We don't need health checks"

### ✅ Say Instead

- "It's a microservices architecture with 4 independent services"
- "JWT stores user data in Base64 (not encrypted), but signature prevents tampering"
- "If User Service fails, Contract and Payment operations fail because they depend on it"
- "In-memory storage is for demonstration; production would use MongoDB or PostgreSQL"
- "Health checks ensure services are ready before dependencies start"

---

## 🎓 VIVA TIPS

### 1. Be Confident

- You built this, you know it better than anyone
- Don't overthink questions
- Admit if unsure: "I'm not sure, but I would implement it this way..."

### 2. Use Analogies

- Docker = Shipping container for application
- JWT = Passport/ID card for user
- Microservices = Different departments in a company
- Retry logic = Knocking on door multiple times if no one answers

### 3. Explain Trade-offs

- Why you chose this over that
- What you would do differently in production
- Limitations you're aware of

### 4. Draw Diagrams

- Service architecture
- Data flow
- Authentication flow
- Help visualize your system

### 5. Have Numbers Ready

- 4 services, ports 3001-3004
- Frontend on 5173
- JWT expires in 2 hours
- Retry: 2 retries, 500ms delay

### 6. Know Alternative Approaches

- "I used in-memory, but could use MongoDB/PostgreSQL"
- "I used environment variables, but could use Consul for discovery"
- "I used HTTP, but could use gRPC for speed"

### 7. Ask Clarifying Questions

If question is unclear: "Do you mean...?" or "Can you clarify...?"

### 8. Show Depth

- Not just "what does it do"
- "Why does it do it"
- "How would it change at scale"

---

## 📚 TECHNOLOGY VERSIONS & PURPOSE

| Technology     | Version | Purpose                 |
| -------------- | ------- | ----------------------- |
| Node.js        | 20      | Runtime environment     |
| Express        | Latest  | Web framework           |
| React          | Latest  | Frontend framework      |
| Vite           | Latest  | Build tool & dev server |
| Axios          | Latest  | HTTP client             |
| JWT            | N/A     | Authentication standard |
| bcryptjs       | Latest  | Password hashing        |
| Docker         | Latest  | Containerization        |
| Docker Compose | 3.8     | Orchestration           |
| GitHub Actions | N/A     | CI/CD                   |

---

## 🔍 HOW TO EXPLAIN EACH COMPONENT

### If Asked About User Service

"It handles authentication and user management. Users can register and login. Password is hashed with bcrypt. On login, a JWT token is issued which expires in 2 hours. Other services call User Service to validate users before allowing operations."

### If Asked About Contract Service

"It manages contracts. A user can apply for a contract, which creates it with PENDING status. An admin can approve it. When approved, it calls Notification Service to notify the user. It also calls User Service to validate the user exists before accepting application. Uses retry logic for resilience."

### If Asked About Payment Service

"It processes payments. User can only pay for APPROVED contracts. It calls Contract Service to validate the contract exists and is approved. After successful payment, it notifies the user via Notification Service. Users can only see their own payments; admins see all."

### If Asked About Notification Service

"It stores notifications. Only internal services can create notifications using x-service-token. Users can query their notifications. It's simple but intentionally so - in production, this would use message queues for reliability."

### If Asked About Frontend

"Built with React + Vite. Uses Axios to call microservices. Stores JWT token in localStorage. Automatically includes token in all API calls via interceptor. Separated axios instances for each backend service for modularity."

### If Asked About Docker

"We use Docker to containerize each service. Each has a Dockerfile defining how to build its image. Docker Compose orchestrates all 5 containers, sets up networking, environment variables, port mappings, and health checks. `docker compose up --build` starts everything with one command."

### If Asked About CI/CD

"GitHub Actions runs on every push. It installs dependencies for each service, builds the frontend (React), and creates Docker images. Automated testing catches bugs early. Eventually would push to Azure Container Registry for deployment."
"GitHub Actions runs on every push. It installs dependencies for each service, builds the frontend (React), and creates Docker images. I can show the workflow run in GitHub during viva. Azure deployment was planned, but I could not complete it because of subscription limitations."

---

## 💬 CONVERSATION STARTERS (If You Get Stuck)

"Let me explain the data flow..."
"A good example is when a user applies for a contract..."
"The interesting part is how services communicate..."
"If we scaled this to production, we would..."
"One thing I learned is..."
"The trade-off I made was..."

---

## 🎯 60-SECOND PROJECT PITCH

"I built a Smart Mall Management System using microservices architecture. It has 4 backend services: User Service for authentication, Contract Service for managing contracts, Payment Service for processing payments, and Notification Service for storing notifications. The frontend is built with React and Vite.

All services communicate via REST APIs. User authentication uses JWT tokens. Security includes password hashing with bcrypt, role-based authorization, and internal service tokens. Everything is containerized with Docker and orchestrated with Docker Compose.

The advantage of microservices is that each service can scale independently and failure in one service doesn't bring down others. I used in-memory storage for simplicity but it can easily be replaced with MongoDB or PostgreSQL. The CI/CD pipeline uses GitHub Actions to automatically build on every push, and I can show the workflow run during viva.

I planned Azure deployment, but it was not completed because of subscription limitations. The architecture is still deployment-ready and demonstrates real-world cloud application design."

---

## ✅ FINAL CHECKLIST BEFORE VIVA

- [ ] Understand why microservices (not monolith)
- [ ] Know all 4 services and their purposes
- [ ] Understand JWT flow (register → login → token → requests)
- [ ] Understand service-to-service communication
- [ ] Know the data flow for each major operation
- [ ] Understand Docker and Docker Compose
- [ ] Be ready to discuss trade-offs (in-memory vs DB)
- [ ] Know how to demo (have terminal ready)
- [ ] Understand CI/CD pipeline
- [ ] Have Azure limitation explanation ready
- [ ] Know alternatives and scalability approach
- [ ] Practice 60-second elevator pitch

---

**You've got this! 💪**
