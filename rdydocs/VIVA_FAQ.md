# VIVA FAQ - Detailed Answers

Use these detailed answers for deep-dive questions during viva.

---

## TABLE OF CONTENTS

1. [Project & Architecture Questions](#project--architecture-questions)
2. [Technical Implementation Questions](#technical-implementation-questions)
3. [Security Questions](#security-questions)
4. [DevOps & Deployment Questions](#devops--deployment-questions)
5. [Database & Storage Questions](#database--storage-questions)
6. [Scalability & Performance Questions](#scalability--performance-questions)
7. [Error Handling & Resilience Questions](#error-handling--resilience-questions)
8. [Conceptual Questions](#conceptual-questions)
9. [Comparison Questions](#comparison-questions)

---

## PROJECT & ARCHITECTURE QUESTIONS

### Q: What is this project?

**A:** This is a **Smart Mall Management System** built as a microservices-based cloud application. The system manages:

- User registration and authentication
- Contract applications and approvals
- Payment processing
- Notification delivery

It consists of 4 independent backend microservices (User, Contract, Payment, Notification), a React frontend, and is containerized using Docker + Docker Compose.

**Why this project?**

- To demonstrate distributed systems architecture
- To learn cloud computing concepts and microservices design
- To practice DevOps (Docker, Docker Compose, CI/CD)
- To build a production-like system

---

### Q: Why did you choose microservices architecture?

**A:** I chose microservices for several reasons:

**1. Scalability**

- If contracts become very popular, I can scale only the Contract Service without scaling others
- Each service can use different resources based on its needs
- Example: If payment becomes bottleneck, add 5 payment instances

**2. Resilience**

- If Payment Service crashes, other services continue working
- In monolith, one bug brings down entire system
- Failure is isolated to one service

**3. Independent Deployment**

- I can update User Service without redeploying everything
- Different teams can work on different services
- Faster deployment cycle

**4. Technology Flexibility**

- User Service can be Node.js
- Contract Service can be Node.js
- Payment Service could be Java (if needed)
- Each service can use best tool for job

**5. Team Organization**

- Different teams own different services
- Clear boundaries and responsibilities
- Easier to understand team's code

**Alternatives I considered:**

- Monolith: Simple to start, hard to scale, one failure breaks all
- Serverless (AWS Lambda): Good for event-driven, but not suitable for this
- Chose Microservices: Best balance for learning and production-like design

---

### Q: What are the 4 microservices and their responsibilities?

**1. User Service (Port 3001)**

- **Responsibility**: Authentication and authorization
- **Key Operations**:
  - User registration with password hashing
  - User login with JWT token generation
  - User information retrieval
  - Internal validation for other services
- **Data**: Users array with id, name, email, hashed_password, role

**2. Contract Service (Port 3002)**

- **Responsibility**: Contract lifecycle management
- **Key Operations**:
  - User applies for contract (calls User Service to validate)
  - View contracts (filtered by role)
  - Admin approves contract (sends notification)
- **Data**: Contracts array with id, userId, title, details, status, timestamps
- **Dependencies**: Depends on User Service and Notification Service

**3. Payment Service (Port 3003)**

- **Responsibility**: Payment processing and tracking
- **Key Operations**:
  - Process payment for approved contracts (calls Contract Service to validate)
  - Record payment transaction
  - Retrieve payment history
  - Send payment notifications
- **Data**: Payments array with id, contractId, userId, amount, status, timestamp
- **Dependencies**: Depends on Contract Service and Notification Service

**4. Notification Service (Port 3004)**

- **Responsibility**: Notification storage and retrieval
- **Key Operations**:
  - Store notifications from other services (internal only)
  - Retrieve notifications for specific user
  - Support different notification types
- **Data**: Notifications array with id, userId, type, message, timestamp
- **No dependencies**: Simplest service, only receives calls

---

### Q: How do these services communicate?

**A:** Services communicate via **REST API with HTTP**:

**Direct Communication Example - Contract Applies:**

```
CLIENT REQUEST
    ↓
User applies for contract at Contract Service (Port 3002)
    ↓
Contract Service receives request
    ↓
Contract Service makes HTTP request to User Service:
    GET http://user-service:3001/internal/users/:id
    Headers: x-service-token
    ↓
User Service validates and responds
    ↓
Contract Service proceeds to create contract
    ↓
Optionally, Contract Service calls Notification Service:
    POST http://notification-service:3004/notify
    Headers: x-service-token
    ↓
Response sent back to client
```

**Key Points:**

- Services don't call each other directly (instance addresses)
- Instead use DNS names: `http://user-service:3001`
- Docker Compose automatic DNS resolution in same network
- **Timeout**: 3 seconds to prevent hanging
- **Retry Logic**: 2 retries with 500ms delay for resilience
- **Authentication**: x-service-token header prevents external unauthorized calls

**Why REST over other options?**

- Easy to understand and debug
- Works across any programming language
- Browser can test with curl/Postman
- Industry standard
- Stateless (good for microservices)

---

### Q: Isn't REST between services slow?

**A:** Good question! Trade-offs:

**REST is slower than:**

- gRPC (binary protocol, faster)
- Direct function calls (monolith)
- Message queues (asynchronous)

**But REST is chosen because:**

- Simplicity for learning
- Ease of debugging (can curl any endpoint)
- Good enough for most use cases
- 3 second timeout + 2 retries handle most issues

**Production improvements:**

- gRPC for internal service communication (binary protocol)
- REST only for external client calls
- Message Queue for async operations (notifications)
- Service mesh (Istio) for advanced routing

---

## TECHNICAL IMPLEMENTATION QUESTIONS

### Q: How does authentication work step-by-step?

**A:** Here's the complete flow:

**1. Registration**

```
User submits: name, email, password, role
    ↓
User Service validates:
  - Email format correct and not duplicate
  - Password at least 6 characters
  - Name provided
    ↓
Password hashing:
  - bcryptjs with 10 salt rounds
  - Original password NEVER stored
  - Hashed password stored
    ↓
User stored in users array:
  {
    id: uuid,
    name: "John",
    email: "john@mail.com",
    password: "$2a$10$...", (hashed)
    role: "student"
  }
    ↓
Response: { message, user }
```

**2. Login**

```
User submits: email, password
    ↓
User Service finds user by email
    ↓
Password comparison:
  - Input password hashed with stored salt
  - Compared with stored hash
  - NEVER reversed/decrypted
    ↓
If match:
  JWT created:
  {
    header: { alg: "HS256", typ: "JWT" }
    payload: { id, email, role }
    signature: HMAC-SHA256(header.payload, secret)
  }
  Encoded: eyJhbGc...payload...signature
    ↓
Token sent to client
    ↓
Response: { token, user }
```

**3. Accessing Protected Routes**

```
Client stores token in localStorage:
  localStorage.setItem("token", "eyJhbGc...")
    ↓
Client includes in every request:
  Authorization: Bearer eyJhbGc...
    ↓
Server receives request:
  - Extract token from Authorization header
  - Verify signature using secret
  - Extract user info from payload
  - Allow access
    ↓
If token invalid or expired (2 hours):
  Response: 401 Unauthorized
```

**Why this approach?**

- Stateless: no server-side session needed
- Scalable: works with multiple servers
- Secure: cryptographically signed
- Self-contained: token has user info

---

### Q: What's inside a JWT token? Can it be hacked?

**A:** JWT structure:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjEyMyIsImVtYWlsIjoiYUBhLmNvbSIsInJvbGUiOiJhZG1pbiJ9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

↓

PART 1 - Header (Base64 decoded):
{
  "alg": "HS256",        ← Algorithm
  "typ": "JWT"           ← Type
}

PART 2 - Payload (Base64 decoded):
{
  "id": "123",           ← User ID
  "email": "a@a.com",    ← Email
  "role": "admin",       ← Role
  "iat": 1516239022,     ← Issued at
  "exp": 1516242622      ← Expiration (2 hours)
}

PART 3 - Signature (Cryptographic):
HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  "super-secret-jwt"
)
```

**Can it be hacked?**

**Payload is NOT encrypted:**

- Base64 is encoding, not encryption
- Can easily decode: `atob("eyJpZCI6IjEy...")`
- Anyone can read user info

**But payload CANNOT be modified:**

- If hacker changes `role: "admin"` to `role: "student"`
- Signature no longer matches
- Server rejects token

**Why this is secure:**

- Only server knows secret (`super-secret-jwt`)
- Only server can create valid signatures
- Tampering detected immediately

**Example attack attempt:**

```javascript
// Hacker reads token
token = "eyJhbGc...valid...token";

// Hacker tries to change
token.payload.role = "admin";

// But signature is now invalid
// Server verifies: HMAC-SHA256(new_payload) ≠ old_signature
// Server rejects with "Invalid token"
```

**Never put sensitive data in JWT:**

- Don't put password
- Don't put credit card
- Only put un-sensitive user info

---

### Q: How does password hashing work with bcrypt?

**A:** Detailed explanation:

**What is hashing?**

- One-way function: password → hash
- Cannot reverse: hash → password (theoretically impossible)
- Same input always produces same output
- Tiny change in input → completely different hash

**Bcrypt specifics:**

**1. Hashing on Registration**

```javascript
const password = "MyPassword123";
const salt = await bcryptjs.genSalt(10);
// Generates random salt with 10 rounds
// Example salt: "$2a$10$r9h.cIPz0gi.URNNX3kh2O"

const hashedPassword = await bcryptjs.hash(password, salt);
// Applies salt 2^10 = 1024 times
// Input password hashed 1024 times with salt
// Result: "$2a$10$r9h.cIPz0gi.URNNX3kh2OPST5xysKqKb21jTLMpI8qyqYF5H7Aq"

// Store in database
user.password = hashedPassword;
```

**Why 10 rounds?**

- 2^10 = 1024 iterations
- Each iteration: ~1 millisecond
- Even if password guessed, must be hashed 1024 times
- Brute force attack: 1 million tries = 1000 seconds

**2. Verifying on Login**

```javascript
const inputPassword = "MyPassword123"; // User enters
const storedHash = "$2a$10$r9h.cIPz0gi..."; // From database

const isValid = await bcryptjs.compare(inputPassword, storedHash);
// Hashes input password and compares with stored hash
// Does NOT decrypt stored hash
```

**Why bcrypt is secure:**

- Salting: Each password has unique salt, even same password = different hash
- Slowing down: 1024 iterations makes brute force expensive
- Industry standard: Used by banks, healthcare, etc.

**Rainbow table attack prevented:**

```
Raw password: "password123"
Without salt: hash always "$abc123def456"
Attacker pre-computes all passwords: "password123" → "$abc123def456"

With salt for user 1: hash = "$2a$10$salt1$hash1"
With salt for user 2: hash = "$2a$10$salt2$hash1"
Same password but different hash!
Rainbow tables useless.
```

---

### Q: How does role-based access control work?

**A:** Three levels of authorization:

**1. Public Access (No Auth)**

```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
// Anyone can access
```

**2. Authenticated Access (Any Logged-in User)**

```javascript
app.get("/contracts", authMiddleware, (req, res) => {
  // authMiddleware checks JWT token
  // req.user contains user info
  // If invalid token → 401 Unauthorized
});
```

**3. Role-based Access**

```javascript
// Only admin can approve
app.put("/contracts/:id/approve", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  // Continue with approval
});

// Student vs student check
app.get("/users/:id", authMiddleware, (req, res) => {
  const requestedUser = users.find((u) => u.id === req.params.id);

  if (
    req.user.role !== "admin" && // Not admin
    req.user.id !== requestedUser.id // Not your own record
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(requestedUser);
});
```

**Roles in this system:**

- **admin**: Can approve contracts, see all users, see all records
- **student**: Can only see own records, apply for contracts, make payments

**Authorization vs Authentication:**

- **Authentication**: Who are you? (JWT validation)
- **Authorization**: What can you do? (Role checking)

---

## SECURITY QUESTIONS

### Q: What security measures did you implement?

**A:** Multiple layers:

**1. Authentication (Who are you?)**

- JWT tokens with HMAC-SHA256 signature
- Token expires after 2 hours
- Token stored in localStorage on frontend
- Sent in Authorization header

**2. Password Security**

- Bcryptjs hashing with 10 rounds
- Passwords never logged or transmitted
- Salt prevents rainbow table attacks

**3. Authorization (What can you do?)**

- Role-based access control (admin vs student)
- User ownership checks
- Admin-only operations (approve contracts)

**4. Input Validation**

- Email format validation
- Password minimum length (6 chars)
- Amount validation (must be positive)
- Required fields checking

**5. Inter-Service Communication**

- x-service-token header for service-to-service calls
- Prevents external services from calling internal endpoints
- Example: Only internal services can call `/notify` endpoint

**6. CORS (Cross-Origin)**

- `app.use(cors())` allows frontend to call backend
- In production: Whitelist specific domains

**7. Environment Variables**

- Secrets in .env, not hardcoded
- JWT_SECRET, SERVICE_TOKEN not in source code

**8. Error Handling**

- Don't leak sensitive info in errors
- Generic "Invalid credentials" instead of "Email not found"
- Stack traces hidden from client

---

### Q: What happens if someone steals a JWT token?

**A:** They can impersonate that user until token expires:

**Attack Scenario:**

```
1. Attacker steals JWT from localStorage (XSS attack)
2. Attacker includes token in requests
3. Can access user's contracts, payments, notifications
4. Can make payments or apply for contracts
5. Token valid for 2 hours
```

**Mitigations:**

```
1. Token expires after 2 hours (limits window)
2. HTTPS only (prevents interception)
3. Secure flag on cookies (if using cookies)
4. HttpOnly flag (if using cookies, prevents JS access)
5. Refresh tokens (new token from refresh token)
6. Token rotation (periodically new tokens)
7. Monitor suspicious activity (fraud detection)
8. Allow user to logout/revoke tokens
```

**Better approaches:**

```javascript
// Current: Store in localStorage (vulnerable to XSS)
localStorage.setItem("token", token);

// Better: Store in HttpOnly cookie (can't be accessed by JS)
// Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

// Best: Refresh token strategy
// Short-lived token (15 min) + long-lived refresh token (7 days)
// If short token stolen, exposure limited to 15 minutes
```

**Why this wasn't implemented:**

- Assignment simplicity
- Learning focus on microservices, not advanced security
- Would be added in production

---

### Q: What about SQL injection or NoSQL injection?

**A:** Currently not applicable:

**In this system:**

- Using in-memory arrays, not databases
- Array.filter() and Array.find() not vulnerable to injection
- No database queries to inject into

**If using MongoDB (in-memory replacement):**

```javascript
// Vulnerable (NOT DOING THIS):
const user = await User.findOne({
  email: `${emailInput}`,
});
// Attacker enters: foo@bar.com" || true || "
// Query becomes: email: "foo@bar.com" || true || ""
// Matches everyone

// Safe (RECOMMENDED):
const user = await User.findOne({
  email: emailInput,
});
// Mongoose automatically parameterizes
// Injection ignored
```

**Best practices:**

- Use ORM/ODM (Mongoose, Sequelize)
- Never concatenate queries
- Use parameterized queries
- Input validation
- Escape user input

---

## DEVOPS & DEPLOYMENT QUESTIONS

### Q: Explain Docker architecture

**A:** Docker is containerization platform:

**Docker Image**

- Blueprint/template for container
- Like a snapshot of application + OS + dependencies
- Defined in Dockerfile
- Immutable (doesn't change once created)
- Multiple containers created from same image

**Dockerfile Example:**

```dockerfile
FROM node:20
# Start with node:20 image

WORKDIR /app
# Set working directory

COPY package*.json ./
# Copy package files

RUN npm install
# Install dependencies

COPY . .
# Copy application code

EXPOSE 3001
# Document that port 3001 is used

CMD ["node", "src/index.js"]
# Default command to run
```

**Docker Container**

- Running instance of image
- Has its own filesystem (separate from host)
- Isolated process space
- Can be started, stopped, restarted
- Multiple containers from same image run independently

**Benefits:**

```
Developer machine (Mac)
  ↓
    Create Docker image
  ↓
Docker Hub (central repository)
  ↓
Production machine (Linux)
  ↓
    Run same image

Result: Works identically everywhere
(Solves "Works on my machine" problem)
```

**Docker vs Virtual Machine:**

```
VIRTUAL MACHINE:
Host OS → Hypervisor → Guest OS → App
• Heavy (2-10 GB per VM)
• Slow startup (minutes)
• Resource intensive

DOCKER:
Host OS → Docker engine → Container → App
• Lightweight (100 MB - 1GB)
• Fast startup (seconds)
• Resource efficient
```

---

### Q: What does Docker Compose do?

**A:** Orchestrates multiple containers:

**Without Docker Compose:**

```bash
# Manually start each service
docker build -t user-service ./user-service
docker run -p 3001:3001 -e PORT=3001 -e JWT_SECRET=... user-service

docker build -t contract-service ./contract-service
docker run -p 3002:3002 --link user-service:user-service \
  -e USER_SERVICE_URL=http://user-service:3001 \
  contract-service

# Manual networking, manual port mapping, manual environment variables
# Tedious and error-prone
```

**With Docker Compose:**

```bash
# One command starts everything
docker compose up --build

# Automatically:
# • Builds all images
# • Creates network
# • Maps ports
# • Sets environment variables
# • Starts containers in order
# • Monitors health checks
```

**docker-compose.yml structure:**

```yaml
version: "3.8"

services:
  user-service:
    build: ./user-service
    # Build from Dockerfile in user-service/

    container_name: user-service
    # Container name (for networking)

    environment:
      PORT: 3001
      JWT_SECRET: super-secret-jwt
    # Environment variables

    ports:
      - "3001:3001"
    # Port mapping: host:container

    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health')..."]
      interval: 10s
      timeout: 5s
      retries: 5
    # Health check ensures service is ready

  contract-service:
    depends_on:
      user-service:
        condition: service_healthy
    # Wait for user-service to be healthy before starting
```

**Benefits:**

1. Single file defines entire system
2. Reproducible (same everywhere)
3. Easy to version control (commit docker-compose.yml)
4. Simple commands (up, down, ps)
5. Great for development and testing

---

### Q: How does service discovery work in Docker Compose?

**A:** Automatic DNS resolution within Docker network:

**Docker Network**

```
When services defined in docker-compose.yml:
• Docker creates virtual network
• All containers connected to this network
• Service names resolve to container IPs automatically
```

**Example:**

```javascript
// In contract-service code
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";

// In production (local development)
process.env.USER_SERVICE_URL = "http://user-service:3001";

// DNS resolution:
// Request to "user-service" → Docker DNS server → Container IP 172.20.0.2
// Container IP 172.20.0.2 → user-service:3001 accessible
```

**Inside vs Outside Container:**

```
From Docker Compose terminal (outside):
curl http://localhost:3001/health        ← Works (host port)

From contract-service code (inside container):
axios.get("http://localhost:3001/...")   ← Fails (localhost = self)
axios.get("http://user-service:3001/...") ← Works (service name)
```

**Kubernetes (Production Alternative):**

```yaml
# Instead of docker-compose.yml
services:
  user-service:
    - 3 replicas
    - Auto DNS: user-service.default.svc.cluster.local
    - Load balanced automatically
    - Auto-scaling based on metrics
```

---

### Q: How does GitHub Actions CI/CD work?

**A:** Automated testing and building:

**Trigger:**

```yaml
on:
  push:
    branches:
      - "**"
# Runs on every push to any branch
```

**Jobs:**

```yaml
jobs:
  install-and-build:
    runs-on: ubuntu-latest
    # Run on GitHub's Ubuntu VM

    strategy:
      matrix:
        service: [user-service, contract-service, ...]
    # Run steps for each service in parallel

    steps:
      - uses: actions/checkout@v4
      # Clone repository

      - uses: actions/setup-node@v4
        with:
          node-version: 20
      # Install Node.js

      - run: npm install
        working-directory: ${{ matrix.service }}
      # Install dependencies

      - run: npm run build
      # Build project

  docker-build:
    needs: install-and-build
    # Only runs if install-and-build succeeds

    steps:
      - run: docker build -t smartmall/user-service ./user-service
      # Build Docker images
```

**Benefits:**

```
1. Catch bugs before merging
2. Automated quality checks
3. Fast feedback (5 minutes)
4. Prevents broken code to main branch
5. Document build process
6. Reproducible builds
```

**CI/CD Flow:**

```
Developer pushes code
    ↓
GitHub detects push
    ↓
Triggers GitHub Actions workflow
    ↓
Runs tests
    ↓
Builds code
    ↓
Creates Docker images
    ↓
If all pass: ✅ Green checkmark on PR
If fails: ❌ Red cross on PR
    ↓
Developer reviews results
    ↓
Merge to main only if green
    ↓
Show workflow run in GitHub Actions during viva
  ↓
Azure deployment was planned, but it was not completed because of subscription limitations
```

---

## DATABASE & STORAGE QUESTIONS

### Q: Why did you use in-memory storage instead of a database?

**A:** Trade-offs:

**Why In-Memory:**

```
Pros:
• Simple to understand
• Fast (no network delay)
• No database setup needed
• Perfect for learning microservices
• Good for assignment demo

Cons:
• Data lost on restart
• Not persistent
• Can't scale to real data
• Can't share between instances
```

**Why in-memory was chosen:**

- Assignment focus: Learn microservices, not database design
- Simplicity: Easier to focus on service communication
- Demo: Sufficient for showing functionality
- Quick iteration: No database migration issues

---

### Q: How would you add a database?

**A:** Multi-step process:

**1. Choose Database**

```
Options:
• MongoDB (NoSQL, flexible schema, document-oriented)
• PostgreSQL (SQL, relational, ACID compliant)
• MySQL (SQL, popular, reliable)
• DynamoDB (AWS managed, pay per request)
```

**2. Install Database Driver/Library**

```bash
npm install mongoose          # For MongoDB
# or
npm install sequelize pg      # For PostgreSQL
```

**3. Update Connection Code**

```javascript
// Before (in-memory)
const users = [];

app.post("/register", async (req, res) => {
  const newUser = { id, name, email, password, role };
  users.push(newUser);
});

// After (MongoDB with Mongoose)
const User = mongoose.model("User", userSchema);

app.post("/register", async (req, res) => {
  const newUser = new User({ name, email, password, role });
  await newUser.save(); // Persist to database
});
```

**4. Update docker-compose.yml**

```yaml
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  user-service:
    depends_on:
      - mongodb
    environment:
      MONGODB_URL: mongodb://admin:password@mongodb:27017/smartmall

volumes:
  mongodb_data:
```

**5. Connection String**

```javascript
const mongoose = require("mongoose");

// Connection string format: mongodb://username:password@host:port/database
const dbUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/smartmall";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

**Benefits of Database:**

```
• Persistent storage (data survives restart)
• Scalable (can store millions of records)
• Queryable (search, filter, sort)
• Transactional (ACID properties if SQL)
• Backupable (automatic snapshots)
• Accessible from multiple instances
```

---

## SCALABILITY & PERFORMANCE QUESTIONS

### Q: How would you scale this to handle 1 million users?

**A:** Multi-layered approach:

**1. Load Balancing**

```
Instead of:
Client → Single user-service instance

Implement:
Client → Load Balancer → [User Service 1, User Service 2, User Service 3]

Tools: NGINX, HAProxy, AWS ELB
Distributes requests across instances
```

**2. Database Optimization**

```
Replace in-memory with production database:
• MongoDB sharding (horizontal partitioning)
• PostgreSQL replication (primary-replica setup)
• Connection pooling to limit database connections

Example MongoDB sharding:
Users collection split across 3 shards by userId
User 1-333k → Shard 1
User 333k-667k → Shard 2
User 667k-1M → Shard 3
Each shard on different server
```

**3. Caching**

```
Redis cache layer:
Client Request → Cache miss → Database (slow)
                 Cache hit → Return (fast)

Example:
const cachedUser = await redis.get(`user:${userId}`);
if (cachedUser) return JSON.parse(cachedUser);

const user = await User.findById(userId);
await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600);
```

**4. Asynchronous Processing**

```
Before: Synchronous chain
  Client → Payment → Contract Service → Notification Service
  (9 seconds if each takes 3 seconds)

After: Asynchronous with message queue
  Client → Payment → Producer → [Queue] → Consumer → Notification
  (400ms if payment processed, notification processed async)

Tools: RabbitMQ, Kafka, AWS SQS
```

**5. API Gateway**

```
Instead of:
Client → user-service:3001
Client → contract-service:3002
Client → payment-service:3003

Implement:
Client → API Gateway (single entry point)
         → Routes to appropriate service
         → Rate limiting (prevent abuse)
         → Load balancing
         → API versioning

Tools: Kong, AWS API Gateway, NGINX
```

**6. Database Optimization**

```
Indexes on frequently queried fields:
db.users.createIndex({ email: 1 });
db.contracts.createIndex({ userId: 1, status: 1 });

Query optimization:
SELECT * FROM contracts          ← Slow (all fields)
SELECT id, status FROM contracts ← Fast (only needed fields)
```

**7. CDN for Frontend**

```
Before:
Requests for JavaScript, CSS, images go to same server
Latency from Australia = 200ms for each asset

After:
CloudFront (global CDN) caches assets
Australian user gets from Sydney edge server (10ms)

Tools: CloudFront, Cloudflare, Fastly
```

**8. Monitoring & Alerting**

```
Track metrics:
• Response time (alert if > 500ms)
• Error rate (alert if > 1%)
• CPU usage (alert if > 80%)
• Database connections (alert if > 90%)
• Queue length (alert if growing)

Tools: Prometheus, Datadog, New Relic
Auto-scale if metrics breach thresholds
```

**9. Microservices Considerations**

```
• Service Mesh (Istio): Advanced networking
• Circuit Breaker: Fail fast if service down
• Rate Limiting: Prevent cascading failures
• Bulkhead Pattern: Isolate resources
• Distributed Tracing: Debug across services
```

**10. Geographic Distribution**

```
Single region (now):
All users → AWS us-east-1 (East Coast USA)
Users in Asia: 200ms latency

Multi-region (scaled):
Asian users → Tokyo region (10ms latency)
European users → Ireland region (10ms latency)
American users → us-east-1 (10ms latency)

Data replication: MongoDB Atlas Global Cluster
```

**Architecture for 1M users:**

```
[Client Requests]
        ↓
[CDN - Static Assets]
        ↓
[Load Balancer]
        ↓
[API Gateway] ← Rate Limiting, API versioning
        ↓
[Service Instances]
  User (5 instances)
  Contract (3 instances)
  Payment (4 instances)
  Notification (2 instances)
        ↓
[Cache Layer - Redis Cluster]
        ↓
[Message Queue - Kafka Cluster]
        ↓
[Database - MongoDB Sharded Cluster]
        ↓
[Backup & Monitoring]
```

---

## ERROR HANDLING & RESILIENCE QUESTIONS

### Q: What happens if a service crashes?

**A:** Different scenarios:

**If User Service crashes:**

```
Impact:
• Registration/login fails (no auth)
• Contract applications fail (can't validate user)
• Payment processing fails (depends on contract service)

Recovery:
• Health check detects service down
• Client retries (2 retries with 500ms delay)
• User sees error: "Please try again"
• Ops team alerted (monitoring system)
• Service restarted automatically (Kubernetes)

Mitigation:
• Run multiple instances of User Service
• Load balancer routes to healthy instance
• Circuit breaker stops sending requests to failed service
```

**If Payment Service crashes:**

```
Impact:
• Payments can't be processed
• Other services continue working

Recovery:
• Contract Service still working (users can apply)
• Notification Service still working
• Temporary inconvenience (payments blocked)
• Payment retried when service recovers
```

**If Notification Service crashes:**

```
Impact:
• Notifications not sent
• But contracts still approved, payments still processed
• User doesn't know about approval/payment (bad UX but system works)

Recovery:
• Graceful degradation (system continues)
• When recovered, notifications can be replayed from queue
• Use message queue (RabbitMQ, Kafka) for reliability
```

**Resilience Patterns:**

**1. Retry Logic**

```javascript
async function requestWithRetry(requestFn, retries = 2, delayMs = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < retries) {
        await sleep(delayMs); // Wait before retry
        // Retry
      }
    }
  }
  throw error; // All retries failed
}
```

**2. Circuit Breaker**

```
Normal:     Service → Success → Return result
            Circuit: CLOSED

Service fails repeatedly:
            Circuit: OPEN (stop sending requests)

After timeout (30s):
            Circuit: HALF_OPEN (try one request)
            Success: → CLOSED (resume)
            Failure: → OPEN (wait again)
```

**3. Timeout**

```javascript
const httpClient = axios.create({ timeout: 3000 });
// Don't wait forever
// Fail fast with "Service unavailable"
```

**4. Bulkhead Pattern**

```
Thread pool 1: User service calls (10 threads)
Thread pool 2: Payment processing (20 threads)
If payment hangs, user service still responsive
Prevents single failure cascading
```

**5. Fallback**

```javascript
let user = await getUserFromDB();
if (!user) {
  user = await getUserFromCache(); // Fallback to cache
}
if (!user) {
  user = defaultUser; // Fallback to default
}
```

---

## CONCEPTUAL QUESTIONS

### Q: What is the CAP theorem?

**A:** Trade-off in distributed systems:

**Three properties:**

**1. Consistency (C)**

- All nodes see same data at same time
- Write to one node → immediately visible on all nodes
- Example: Transfer $100 from Account A to B
  - World sees Account A -$100 and Account B +$100
  - Never see intermediate state

**2. Availability (A)**

- System always responds
- No "service unavailable" errors
- Every request gets response (success or fail)

**3. Partition Tolerance (P)**

- System continues despite network failures
- Servers can't communicate
- System still works (maybe with stale data)

**CAP Theorem:**
In a distributed system, **choose 2 of 3**

**Combinations:**

**1. CA (Consistency + Availability, no Partition Tolerance)**

```
Single data center, no network issues
All nodes consistent, always available
If network partitions: Whole system stops
Example: Traditional database (not good for internet-scale)
```

**2. CP (Consistency + Partition Tolerance, no Availability)**

```
Maintain consistency even during network failures
Might not respond (unavailable) to maintain consistency
Example: MongoDB strong consistency mode
During partition: wait to resync before responding
```

**3. AP (Availability + Partition Tolerance, no Consistency)**

```
System always responds even with inconsistent data
Stays available during network failures
Data eventually becomes consistent
Example: Our Smart Mall system (and most internet applications)

Scenario:
Payment Service makes payment and notifies
Notification Service network down
Customer sees payment successful but no notification
Eventually gets notification (eventually consistent)
```

**Our System: AP**

```
Choice: Availability + Partition Tolerance
Sacrifice: Consistency

Why:
• System must stay available (users waiting for response)
• Network failures will happen
• Consistency loss acceptable (notifications might be delayed)
• Other systems (banks): CP (consistency more important than availability)
```

---

### Q: What's eventually consistent?

**A:** Concept where data becomes consistent over time:

**Strong Consistency (Immediate)**

```
Update payment status to PAID
Immediately: All services see PAID
Cost: Slow (need to confirm all replicas)
```

**Eventual Consistency (Eventually)**

```
Update payment status to PAID on Primary Server
After 100ms: Replica 1 syncs
After 150ms: Replica 2 syncs
After 200ms: Replica 3 syncs

Between 0-200ms: Inconsistent data
After 200ms: Consistent

Benefit: Fast writes
Cost: Brief inconsistency window (usually acceptable)
```

**In our system:**

```
Admin approves contract:
1. Contract status → APPROVED (fast)
2. Notification sent asynchronously
3. If notification delayed (system slow):
   • Contract shows APPROVED (correct)
   • Notification arrives later
   • Eventually consistent (data is correct eventually)

Acceptable because notification latency doesn't harm business logic
```

---

### Q: What's Synchronous vs Asynchronous communication?

**A:** Two communication patterns:

**1. Synchronous (Blocking)**

```
Caller sends request
Caller waits for response
Caller blocks until response received
Used: HTTP REST calls in our system

Example: Contract approval workflow
Payment Service calls Contract Service:
    "Please validate this contract"
    [waits...]
    [waits...]
    Receives: "Contract is APPROVED"
    Continues

Advantages:
• Simple to understand
• Immediate response
• Error handling straightforward

Disadvantages:
• If service slow, caller blocked
• If service down, caller blocked
• Not scalable for high-load
```

**2. Asynchronous (Non-blocking)**

```
Caller sends request
Caller continues immediately (doesn't wait)
Response processed later via callback/event

Example: With message queue
Payment Service sends to queue:
    "notify user about payment success"
    [returns immediately]
    Continues processing

Notification Service reads from queue:
    Sends notification whenever ready

Advantages:
• Caller not blocked
• Scales to high load
• Service failure doesn't block caller
• Can retry if service down

Disadvantages:
• More complex (need queue infrastructure)
• Eventual consistency (notification delayed)
• Harder debugging
```

**When to use which:**

```
SYNCHRONOUS:
• Authentication (must know immediately)
• Validation (must know if valid before proceeding)
• Getting user info (need data to continue)

ASYNCHRONOUS:
• Notifications (user doesn't need immediately)
• Emails (can send later)
• Analytics (can process in background)
• Audit logging (can be delayed)
```

**Our system currently:**

```
SYNCHRONOUS:
Payment Service → Contract Service validation (blocking)

BETTER (asynchronous):
Payment Service → Message Queue → Notification Worker
Contract Service → Message Queue → Notification Worker
```

---

## COMPARISON QUESTIONS

### Q: Monolith vs Microservices

**A:** Trade-offs:

**MONOLITH (Single application)**

```
Structure:
User Service + Contract Service + Payment Service = 1 Application

Pros:
✓ Simple to start
✓ Easy to debug
✓ Single deployment
✓ Transactional consistency (ACID)
✓ Easier to test
✓ Single database

Cons:
✗ Hard to scale (scale everything or nothing)
✗ Hard to change (one bug affects all)
✗ Hard to deploy (redeploy everything)
✗ Hard to mix languages (all same tech stack)
✗ Tight coupling (dependencies everywhere)
✗ Performance (one slow query affects all)
```

**MICROSERVICES (Multiple independent services)**

```
Structure:
User Service | Contract Service | Payment Service
(independent applications)

Pros:
✓ Easy to scale (scale individually)
✓ Easy to change (update one service)
✓ Easy to deploy (deploy independently)
✓ Can mix languages (Java, Node, Python)
✓ Loose coupling (services independent)
✓ Fault isolation (one failure doesn't break all)
✓ Organizational structure matches code structure

Cons:
✗ Complex to start (need Docker, orchestration)
✗ Hard to debug (distributed tracing needed)
✗ Multiple deployments (more complex)
✗ Network issues (service calls can fail)
✗ Eventual consistency (can't guarantee immediate consistency)
✗ Increased operational complexity
```

**When to use Monolith:**

- Small team (< 5 people)
- Single business domain
- Simple application
- Quick MVP needed

**When to use Microservices:**

- Large team (> 10 people)
- Multiple independent domains
- High scalability needed
- Rapid change required

**Our choice: MICROSERVICES for learning.**

```
Why:
• Learn distributed systems
• Industry standard approach
• Practice DevOps
• Better prepare for real-world job
```

---

### Q: REST vs GraphQL vs gRPC

**A:** Three API styles:

**REST (Representational State Transfer)**

```
Used: HTTP methods, URLs represent resources

Example call:
GET /users/123
GET /contracts?status=PENDING
POST /payments
PUT /contracts/456/approve

Pros:
✓ Simple, widely understood
✓ HTTP caching works
✓ Easy to test (curl, browser)
✓ Large ecosystem

Cons:
✗ Over-fetching (get more data than needed)
  GET /users/123 returns all user fields, frontend only needs name, email
✗ Under-fetching (need multiple calls)
  GET /users/123 → GET /contracts?userId=123 → GET /payments?userId=123
✗ Multiple API versions (/v1/, /v2/)

Used in: Our system
```

**GraphQL**

```
Query language for APIs, client specifies exact data needed

Example call:
{
  user(id: 123) {
    name
    email
    contracts {
      title
      status
    }
  }
}

Pros:
✓ Exact data needed (no over-fetching)
✓ Single request for related data (no under-fetching)
✓ Strongly typed schema
✓ Great for mobile (bandwidth limited)

Cons:
✗ Steeper learning curve
✗ Server-side caching harder
✗ Query complexity (DOS attacks)
✗ Slower simple queries

Used by: Facebook, GitHub, Twitter, Shopify

When to use: Complex data requirements, many client types
```

**gRPC**

```
High-performance RPC framework using HTTP/2 and Protocol Buffers

Example:
service UserService {
  rpc GetUser(GetUserRequest) returns (User) {}
  rpc ListContracts(ListContractsRequest) returns (stream Contract) {}
}

Pros:
✓ Very fast (binary protocol)
✓ Multiplexing (many requests over 1 connection)
✓ Streaming support
✓ Strongly typed
✓ Language agnostic

Cons:
✗ Not human-readable (binary)
✗ Not browser-friendly (needs special client)
✗ Setup more complex
✗ Smaller ecosystem

Used by: Google, Netflix, Uber, Cisco

When to use: High-performance, service-to-service communication
```

**Comparison Table:**

```
Feature          REST    GraphQL   gRPC
Speed            Slow    Medium    Fast
Simplicity       High    Medium    Low
Developer UX     High    High      Low
Caching          Easy    Hard      Hard
Mobile friendly  No      Yes       No
Browser friendly Yes     Yes       No
Learning curve   Low     Medium    High
Industry adoption High    Growing   Growing
```

**Our choice: REST**

```
Why:
• Simplicity (focus on microservices, not new tech)
• Easy to learn
• Great for learning
• Easy testing with curl
• Perfect for assignment

If production: Consider gRPC for service-to-service (internal)
              Keep REST for external API (exposed to clients)
```

---

### Q: Docker vs Kubernetes vs Serverless

**A:** Three deployment approaches:

**DOCKER (Container Platform)**

```
What: Containerization technology
Container = Application + dependencies isolated

Used in: Our system (docker-compose)

Pros:
✓ Isolates application
✓ Works everywhere (laptop, server, cloud)
✓ Local development matches production
✓ Easy to use
✓ Small learning curve

Cons:
✗ Manual scaling (need to manage instances)
✗ No automatic restart
✗ No load balancing built-in
✗ No rolling updates
✗ Need to manage infrastructure

Best for: Development, small deployments, learning
```

**KUBERNETES (Container Orchestration)**

```
What: Orchestrates containers across cluster of machines

Manages:
✓ Automatic scaling (traffic high → more containers)
✓ Self-healing (container crashes → restart)
✓ Rolling updates (gradual deployment)
✓ Load balancing (route across containers)
✓ Resource management (CPU, memory)

Pros:
✓ Production-grade
✓ Scales automatically
✓ Highly available
✓ Industry standard

Cons:
✗ Complex (steep learning curve)
✗ Operational overhead
✗ Overkill for small projects
✗ Cost (need cluster of machines)

Best for: Production systems, high traffic, large teams
Used by: Google, Microsoft, Netflix, Uber

Example:
kubectl scale deployment payment-service --replicas=10
→ Automatically runs 10 instances of payment service
→ Load balancer distributes traffic
→ If one crashes, 9 still running
→ Replaced automatically
```

**SERVERLESS (Function as a Service)**

```
What: Upload function, cloud provider manages everything

Examples: AWS Lambda, Google Cloud Functions, Azure Functions

Pros:
✓ No server management
✓ Auto-scaling (infinite)
✓ Pay only for execution
✓ Fast deployment
✓ Great for APIs, webhooks

Cons:
✗ Cold start latency (first call slow)
✗ Execution time limits (max 15 min)
✗ Vendor lock-in
✗ Debugging harder
✗ Not suitable for long-running processes

Best for: Simple APIs, webhooks, scheduled tasks, event processing
```

**Comparison:**

```
Aspect          Docker      Kubernetes    Serverless
Deployment      Manual      Automatic     Automatic
Scaling         Manual      Automatic     Automatic
Learning curve  Easy        Hard          Medium
Cost            Pay for VM  Pay for K8s   Pay per exec
Control         High        Medium        Low
Suitable for    Dev, small  Production    APIs, Tasks
Typical case    10 users    1M users      Notifications
```

**Evolution:**

```
Phase 1: Buy server → Monolith on server (2010)
Phase 2: Docker → Containerize app (2015)
Phase 3: Kubernetes → Orchestrate containers (2018)
Phase 4: Serverless → Upload code (2020+)

Our system: Phase 2 (Docker Compose)
Next step: Phase 3 (Kubernetes)
Future: Phase 4 (Serverless where applicable)
```

---

**End of FAQ - Good luck with your viva! 🚀**
