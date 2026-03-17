# Viva & Interview Preparation Guide

Complete list of potential viva questions with detailed answers.

---

## 🎯 Architecture & Design Questions

### Q1: Explain your system architecture

**Answer:**
"Our Smart Campus Service System uses microservices architecture with 4 independent services:

1. **Auth Service (Port 3001)** - Manages user authentication
   - Register endpoint: creates new users
   - Login endpoint: authenticates and returns JWT token
   - Verify endpoint: validates JWT tokens
   - Uses bcryptjs for password hashing
2. **Request Service (Port 3002)** - Main business logic
   - Create endpoint: allows authenticated users to create service requests
   - Get endpoints: retrieve requests by user or view all
   - Acts as orchestrator by calling other services
3. **Notification Service (Port 3003)** - Handles notifications
   - Receives notification requests from Request Service
   - Stores notifications in JSON file
   - Can retrieve notifications by user
4. **Logging Service (Port 3004)** - Maintains audit trail
   - Receives log entries from all services
   - Stores logs in both JSON and text files
   - Supports filtering by service or user

Each service has its own database, API endpoints, and can be deployed independently."

### Q2: Why did you choose microservices over monolithic?

**Answer:**
"Microservices offer several advantages:

1. **Scalability**: If Request Service gets heavy traffic, we scale only that service. Monolith requires scaling entire application.

2. **Independent Deployment**: Can update Auth Service without redeploying Logging Service.

3. **Technology Flexibility**: Each service can use different tech. We could rewrite Notification Service in Python while keeping others in Node.js.

4. **Team Autonomy**: Different teams can develop different services independently.

5. **Fault Isolation**: If Logging Service crashes, requests still get created.

6. **Easier Testing**: Smaller codebases are easier to test and maintain.

Tradeoff: More complex distributed system, harder debugging, network latency."

### Q3: Explain the inter-service communication

**Answer:**
"Inter-service communication happens synchronously using HTTP REST calls:

1. User creates request via Request Service API
2. Request Service verifies JWT token
3. Request Service creates request in its database
4. Request Service calls Notification Service:
   ```javascript
   const response = await axios.post("http://localhost:3003/notify", {
     userId,
     requestId,
     message,
   });
   ```
5. Request Service calls Logging Service:
   ```javascript
   const response = await axios.post("http://localhost:3004/log", {
     service,
     action,
     requestId,
     userId,
     details,
   });
   ```
6. Request Service returns combined response

We use axios library for making HTTP calls. Services communicate over network, not shared memory.

In production, we could use async patterns with message queues like RabbitMQ."

### Q4: How are the services independent?

**Answer:**
"Services are independent in several ways:

1. **Separate Databases**: Each service has own database (JSON files in this case)
   - Auth Service: `db/users.json`
   - Request Service: `db/requests.json`
   - Notification Service: logs in `logs/notifications.json`
   - Logging Service: logs in `logs/logs.json`

2. **Different Ports**: Run on different ports (3001, 3002, 3003, 3004)

3. **Own Dependencies**: Each has own package.json and node_modules

4. **Independent Scaling**: Can deploy multiple instances of one service

5. **No Code Sharing**: Services don't import code from each other

6. **Decoupled Data**: Changes to Notification database don't affect Request Service

7. **Can Fail Independently**: If one crashes, others keep running (with error handling)"

---

## 🔐 Security Questions

### Q5: How did you implement authentication?

**Answer:**
"We use JWT (JSON Web Token) authentication:

1. **Registration**:

   ```javascript
   const hashedPassword = await bcrypt.hash(password, 10);
   // Store: { email, hashedPassword, name, id }
   ```

2. **Login**:
   - User provides email and password
   - We hash the provided password and compare with stored hash
   - If match, generate JWT:

   ```javascript
   const token = jwt.sign({ userId: user.id, email, name }, JWT_SECRET, {
     expiresIn: "24h",
   });
   ```

3. **Token Verification**:
   - Client sends token in Authorization header: `Bearer TOKEN`
   - Request Service verifies using middleware:

   ```javascript
   const decoded = jwt.verify(token, JWT_SECRET);
   ```

4. **Security Features**:
   - Password never transmitted over network (hashed)
   - Token signed with secret key
   - Token expires after 24 hours
   - Token contains user info (no DB call needed)"

### Q6: What about security between services?

**Answer:**
"Current implementation: Services are on localhost, so trusted network.

In production, we would add:

1. **API Keys**: Each service authenticates with API key
2. **mTLS (mutual TLS)**: Certificate-based authentication
3. **Service Mesh (Istio)**: Automatic service discovery and security
4. **Network Policies**: Firewall rules between services
5. **Rate Limiting**: Prevent service abuse
6. **Input Validation**: All services validate incoming data

Code example for API key validation:

````javascript
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SERVICE_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
}
```"

### Q7: How do you handle secrets?
**Answer:**
"We use environment variables with .env files:

1. **Configuration**:
````

JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=production

````

2. **Access in Code**:
```javascript
const secret = process.env.JWT_SECRET;
````

3. **Never Committed**: .gitignore excludes .env files

4. **Production Best Practices**:
   - Use AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Kubernetes Secrets

5. **Rotation**: Secrets should be rotated regularly

Important: Never hardcode secrets or commit .env files!"

---

## 🏗️ Implementation Questions

### Q8: How does Request Service orchestrate calls?

**Answer:**
"The request.js file contains the orchestration logic:

```javascript
router.post('/', verifyToken, async (req, res) => {
  // 1. Create request
  const newRequest = { ... };

  // 2. Save to database
  const requests = readRequests();
  requests.push(newRequest);
  saveRequests(requests);

  // 3. Call Notification Service
  const notifyResult = await callService(
    process.env.NOTIFICATION_SERVICE_URL,
    notificationPayload
  );

  // 4. Call Logging Service
  const logResult = await callService(
    process.env.LOGGING_SERVICE_URL,
    logPayload
  );

  // 5. Return combined response
  res.status(201).json({
    message: 'Request created',
    request: newRequest,
    notificationStatus: notifyResult?.status,
    loggingStatus: logResult?.status
  });
});
```

Key points:

- Uses async/await for sequential calls
- Could use Promise.all() for parallel calls
- Handles errors gracefully with try/catch
- Uses environment variables for service URLs"

### Q9: How is the database structured?

**Answer:**
"We use simple file-based JSON databases:

Auth Service (users.json):

```json
[
  {
    \"id\": \"1710750234567\",
    \"name\": \"John Doe\",
    \"email\": \"john@example.com\",
    \"password\": \"$2a$10$...\", // hashed
    \"createdAt\": \"2026-03-17T10:15:00Z\"
  }
]
```

Request Service (requests.json):

```json
[
  {
    \"id\": \"1710750350000\",
    \"userId\": \"1710750234567\",
    \"userName\": \"John Doe\",
    \"title\": \"Fix AC\",
    \"description\": \"...\",
    \"type\": \"maintenance\",
    \"status\": \"pending\",
    \"createdAt\": \"2026-03-17T10:15:00Z\"
  }
]
```

Advantages of JSON files:

- Simple and readable
- No database setup required
- Good for learning/prototyping

Disadvantages:

- Not scalable
- No concurrent write protection
- Not suitable for large data

Production: Use MongoDB, PostgreSQL, MySQL"

### Q10: How do you prevent concurrent access issues?

**Answer:**
"Current implementation: No protection (acceptable for single-user demo)

For production, solutions:

1. **Database Locking**:
   - Database handles concurrent access
   - ACID properties ensure consistency
2. **Message Queue**:
   - RabbitMQ/Kafka serializes writes
   ```
   User → Request Service → Message Queue → Storage
   ```
3. **Read-Write Locks**:

   ```javascript
   const mutex = new Mutex();

   async function saveRequests(requests) {
     const release = await mutex.acquire();
     try {
       fs.writeFileSync(dbPath, JSON.stringify(requests));
     } finally {
       release();
     }
   }
   ```

4. **File Locking Library**:
   ```javascript
   const lockfile = require("proper-lockfile");
   await lockfile.lock(dbPath);
   fs.writeFileSync(dbPath, data);
   await lockfile.unlock(dbPath);
   ```

For this assignment, JSON files are acceptable for demo purposes."

---

## 🐳 Docker & DevOps Questions

### Q11: Explain your Dockerfile

**Answer:**
"Each service has similar Dockerfile:

```dockerfile
# Start with Node 18 Alpine (lightweight)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node -e \"require('http').get('http://localhost:3001/health', ...)\"

# Start service
CMD [\"npm\", \"start\"]
```

Key decisions:

1. **Alpine Linux**: Smaller than full Node image (50MB vs 380MB)
2. **Two-stage build**: Could use for smaller final image
3. **Health check**: Tells Docker if service is healthy
4. **Non-root user**: Should add for security
5. **Production deps only**: Excludes dev dependencies"

### Q12: How does docker-compose work?

**Answer:**
"docker-compose.yml orchestrates all services:

```yaml
version: "3.8"

services:
  auth-service:
    build: ./auth-service # Build from Dockerfile
    container_name: auth-service
    ports:
      - \"3001:3001\" # Map ports
    environment: # Environment variables
      - PORT=3001
      - JWT_SECRET=...
    networks: # Custom network
      - campus-network
    healthcheck: # Health monitoring
      test: [\"CMD\", \"curl\", \"-f\", ...]

  request-service:
    depends_on:
      auth-service:
        condition: service_healthy # Wait for dependency
```

Benefits:

1. **Single command**: `docker-compose up` starts all services
2. **Networking**: Services can communicate by name
3. **Dependency management**: Services start in order
4. **Environment variables**: Centralized configuration
5. **Easy cleanup**: `docker-compose down` removes everything

Network allows services to communicate:

- `http://auth-service:3001` instead of `http://localhost:3001`"

### Q13: How would you deploy on cloud?

**Answer:**
"Multiple deployment options:

**1. AWS ECS (Recommended for beginners)**:

```
1. Push code to GitHub
2. Create ECR repositories
3. AWS CodeBuild: builds Docker images
4. Push to ECR
5. Create ECS cluster
6. Create task definition
7. Create service with load balancer
8. Access via load balancer URL
```

**2. Render or Railway** (easiest):

```
1. Connect GitHub repo
2. Select docker-compose.yml
3. Click deploy
4. Automatically builds and runs
5. Provides public URL
```

**3. Azure Container Apps**:

```
1. Push images to ACR (Azure Container Registry)
2. Create container app
3. Configure auto-scaling
4. Deploy
```

**4. Kubernetes (most powerful)**:

```
1. Create K8s manifests (deployment, service, etc)
2. Configure auto-scaling policies
3. Use Helm charts
4. Deploy to EKS/GKE/AKS
```

For this assignment, recommend Render or Railway (simplest)."

### Q14: What's the CI/CD pipeline doing?

**Answer:**
"GitHub Actions workflow (ci-cd.yml) automatically:

1. **On every push to main/develop**:
   - Checks out code
   - Sets up Node.js environment
2. **For each service**:
   - Installs dependencies
   - Runs tests
   - Lint checks (optional)
3. **Builds Docker images**:
   - For each service
   - Doesn't push (could push to Docker Hub)
4. **Code quality checks**:
   - Placeholder for SonarCloud integration
5. **Notification**:
   - Notifies on success/failure

Benefits:

- Catches bugs early
- Ensures consistent builds
- Automated testing
- Can auto-deploy on green tests

Current setup: Very basic, good for student project"

---

## 🌐 Networking & Scalability Questions

### Q15: How do services discover each other?

**Answer:**
"Service discovery methods:

**Current (Local/Docker)**:

- Hardcoded URLs in .env:
  ```
  NOTIFICATION_SERVICE_URL=http://notification-service:3003
  LOGGING_SERVICE_URL=http://logging-service:3004
  ```
- Works in docker-compose network

**Production Options**:

1. **DNS-based** (simplest for Kubernetes):

   ```javascript
   // Service name becomes hostname
   axios.post("http://notification-service.default.svc.cluster.local/notify");
   ```

2. **Service Registry** (Consul, Eureka):

   ```
   Request Service queries Consul
   → \"Where is Notification Service?\"
   → Consul: \"192.168.1.42:3003\"
   ```

3. **Load Balancer**:

   ```
   All requests → Load Balancer → Routes to service
   ```

4. **API Gateway**:

   ```
   All requests → API Gateway → Routes to appropriate service
   ```

5. **Service Mesh** (Istio):
   ```
   Automatically manages service discovery
   ```

For this project, hardcoded URLs are fine."

### Q16: How would you scale this system?

**Answer:**
"Scaling strategies:

**Vertical Scaling** (increase resources):

```
Single server with 2CPU → 8CPU
```

Limited, costly

**Horizontal Scaling** (add more servers):

1. **Load Balancer**:

   ```
   Client → Load Balancer → [Request Service 1, 2, 3]
   ```

2. **Docker Compose scaling**:

   ```bash
   docker-compose up --scale request-service=3
   ```

3. **Kubernetes**:

   ```yaml
   replicas: 3
   autoscaling:
     minReplicas: 2
     maxReplicas: 10
     targetCPUUtilization: 70%
   ```

4. **Database**:
   - Sharding: Split data across databases
   - Read replicas: Secondary databases for reads
   - Cache layer: Redis for frequently accessed data

**Bottleneck Analysis**:

- If Request Service slow → scale it
- If database slow → add replicas/cache
- If network slow → CDN, edge locations
- If auth slow → cache tokens

**Current Limitation**:

- JSON files not scalable
- Need proper database
- Need caching layer"

### Q17: What about handling failures?

**Answer:**
"Fault tolerance strategies:

**Current Implementation**:

```javascript
try {
  const response = await axios.post(url, data, { timeout: 5000 });
} catch (err) {
  console.error("Error:", err);
  return { error: err.message };
}
```

**Better Approaches**:

1. **Timeouts**:

   ```javascript
   axios.post(url, data, { timeout: 3000 });
   ```

2. **Retries with Exponential Backoff**:

   ```javascript
   async function callWithRetry(url, data, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await axios.post(url, data);
       } catch (err) {
         await sleep(Math.pow(2, i) * 1000);
       }
     }
   }
   ```

3. **Circuit Breaker**:

   ```javascript
   // After 3 failures, stop calling service
   // Check back after 30 seconds
   if (failureCount > 3 && !lastRetryTime) {
     return { error: "Service unavailable" };
   }
   ```

4. **Graceful Degradation**:

   ```javascript
   // If Notification fails, still create request
   // Log error, continue
   ```

5. **Message Queue** (async):

   ```
   Request Service → Queue → Notification Service
   // Request Service doesn't wait
   ```

6. **Monitoring & Alerting**:
   - New Relic
   - Datadog
   - CloudWatch

For this project, basic error handling is sufficient."

---

## 🧪 Testing & Quality Questions

### Q18: How would you test this system?

**Answer:**
"Testing strategies:

**Unit Tests**:

```javascript
describe("Auth Service", () => {
  test("should hash password", async () => {
    const hashed = await bcrypt.hash("pass123", 10);
    const match = await bcrypt.compare("pass123", hashed);
    expect(match).toBe(true);
  });
});
```

**Integration Tests**:

```javascript
describe("Request Workflow", () => {
  test("should create request and call services", async () => {
    const response = await fetch("/request", {
      method: "POST",
      headers: { Authorization: "Bearer TOKEN" },
      body: JSON.stringify({ title: "..." }),
    });
    expect(response.status).toBe(201);
  });
});
```

**API Tests** (Postman/Jest):

```bash
npm test
```

**Load Testing** (Apache JMeter, k6):

```
Simulate 1000 users creating requests
Measure response time, errors
```

**Security Testing**:

- SQL injection attempts
- JWT manipulation
- Missing authentication checks

**Tools**:

- Jest (unit/integration)
- Postman (API)
- Cypress (E2E)
- JMeter (load)
- OWASP ZAP (security)

Current: Placeholder test command"

### Q19: How do you monitor and log?

**Answer:**
"Logging strategy:

**Application Logs**:

1. Console logs (development):

   ```javascript
   console.log("📢 NOTIFICATION SENT");
   ```

2. File logs:

   ```javascript
   fs.appendFileSync("app.log", logMessage);
   ```

3. Structured logging:
   ```javascript
   logger.info("request_created", {
     userId: "123",
     requestId: "456",
     timestamp: new Date(),
   });
   ```

**Monitoring**:

1. Health checks:

   ```javascript
   app.get("/health", (req, res) => res.json({ status: "ok" }));
   ```

2. Metrics (Prometheus):

   ```javascript
   // Count requests, response times, errors
   ```

3. Dashboards (Grafana):
   - CPU usage
   - Memory usage
   - Request rate
   - Error rate

**Centralized Logging** (ELK Stack):

```
All services → Logstash → Elasticsearch → Kibana
```

**Current Implementation**:

- Console logs in each service
- File logs in logging-service
- Basic health checks

**Production Tools**:

- DataDog
- New Relic
- CloudWatch (AWS)
- Azure Monitor"

---

## 💼 General & Best Practices

### Q20: What are microservices best practices?

**Answer:**
"Key principles:

1. **Single Responsibility**: Each service does one thing
   - Auth Service: only authentication
   - Request Service: only requests
2. **Loose Coupling**: Services don't depend on implementation details
   - Use APIs, not shared code
3. **High Cohesion**: Related functionality together
   - All auth logic in Auth Service
4. **API Contracts**: Clear, documented interfaces
   - Swagger/OpenAPI specs
5. **Versioning**: Handle API changes gracefully
   - /v1/request, /v2/request
6. **Stateless Services**: Any instance can handle any request
   - Don't store session state
7. **Configuration Management**: External config, not hardcoded
   - Environment variables
8. **Monitoring**: Observe all services
   - Logs, metrics, traces
9. **Security**: Each service validates input
   - Authentication, authorization
10. **Documentation**: Clear API docs
    - Swagger, README
    - Service communication diagram"

### Q21: What would you improve?

**Answer:**
"If more time, improvements:

**Technical**:

1. Use MongoDB instead of JSON files
2. Add Redis caching layer
3. Implement async messaging (RabbitMQ)
4. Add proper error handling/retries
5. Implement circuit breaker pattern
6. Add database migrations
7. Add more comprehensive logging
8. Implement rate limiting

**Testing**:

1. Add unit tests
2. Add integration tests
3. Add load testing
4. Add security testing

**DevOps**:

1. Multi-stage Docker builds
2. Docker registry (Docker Hub, ECR)
3. Kubernetes manifests
4. Helm charts
5. GitOps (ArgoCD)
6. Automated deployments
7. Database backups

**Monitoring**:

1. Prometheus metrics
2. Grafana dashboards
3. ELK logging stack
4. APM tool (DataDog)
5. Distributed tracing (Jaeger)

**Security**:

1. API keys between services
2. TLS encryption
3. Input validation library
4. Security scanning (Snyk)
5. Secret rotation

Current scope: Perfect for learning assignment"

### Q22: How does this relate to real-world systems?

**Answer:**
"Real-world microservices are similar but more:

**Scale**:

- Services handle millions of requests
- Hundreds of microservices
- Global distribution

**Complexity**:

- Distributed tracing required
- Service mesh (Istio)
- Database eventually consistency

**Operations**:

- Kubernetes orchestration
- Container registries
- GitOps deployment
- Error budgets

**Example Architecture** (Uber-like system):

```
Mobile App → API Gateway → Microservices:
  - User Service
  - Ride Matching Service
  - Payment Service
  - Notification Service
  - Location Service
  - Rating Service

All services backed by:
  - Databases (PostgreSQL, Cassandra)
  - Cache (Redis)
  - Message Queue (Kafka)
  - Search (Elasticsearch)
```

**Lessons from this project**:

1. How to structure microservices
2. Inter-service communication
3. Authentication in distributed systems
4. Containerization benefits
5. CI/CD automation
6. Infrastructure as code

This assignment covers fundamentals used in real companies!"

---

## 🎯 Final Tips for Viva

### How to Answer Viva Questions

1. **Start with Architecture**
   - Draw diagram if possible
   - Explain 4 services and their roles

2. **Demonstrate Live**
   - Register user
   - Create request
   - Show inter-service communication
   - Check notifications and logs

3. **Explain Code**
   - Show request.js orchestration logic
   - Explain JWT verification middleware
   - Show error handling

4. **Discuss Design Decisions**
   - Why microservices?
   - Why this tech stack?
   - What would change if...?

5. **Know Your Limitations**
   - File-based DB not scalable
   - No async messaging
   - Basic error handling
   - No distributed tracing

6. **Be Confident**
   - You built something complex!
   - Understand the fundamentals
   - It's okay to say "in production we would..."

### Practice Viva (Self-Test)

Cover these areas:

- [ ] Architecture explanation
- [ ] Inter-service communication flow
- [ ] JWT authentication
- [ ] Docker concepts
- [ ] Deployment options
- [ ] Scaling strategies
- [ ] Error handling
- [ ] Security measures
- [ ] CI/CD pipeline
- [ ] Code walkthrough

---

**You're well-prepared! Good luck! 🚀**
