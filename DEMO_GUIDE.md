# Smart Campus Service System - Inter-Service Communication Demo

## 🎬 2-Minute Demonstration Script

This guide shows exactly how to demonstrate inter-service communication in your viva.

## Prerequisites

Ensure all 4 services are running:

- Auth Service: http://localhost:3001
- Request Service: http://localhost:3002
- Notification Service: http://localhost:3003
- Logging Service: http://localhost:3004

Check health of all services:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

All should respond with `{"status": "Service is running"}`

---

## 🚀 Quick Demo (2 Minutes)

### Step 1: Register a User (20 seconds)

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@campus.com",
    "password": "demo123"
  }'
```

**What to explain:**

- "This registers a user in Auth Service"
- "Password is hashed with bcryptjs"
- "User data saved to file-based database"

**Expected response:**

```json
{
  "message": "User registered successfully",
  "userId": "1710750234567",
  "email": "demo@campus.com"
}
```

### Step 2: Login & Get JWT Token (20 seconds)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@campus.com",
    "password": "demo123"
  }'
```

**What to explain:**

- "Auth Service generates JWT token valid for 24 hours"
- "Token contains user ID and email"
- "This token is required for creating requests"

**Save the token from response** (you'll need it next)

**Expected response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1710750234567",
    "name": "Demo User",
    "email": "demo@campus.com"
  }
}
```

### Step 3: Create a Service Request (THE MAIN DEMO) (60 seconds)

Replace `YOUR_TOKEN` with the token from Step 2:

```bash
curl -X POST http://localhost:3002/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Fix AC in Room 105",
    "description": "The air conditioning is not working. Temperature is too high.",
    "type": "maintenance"
  }'
```

**WATCH THE MAGIC HAPPEN!** 🎉

This single API call triggers:

1. **Request Service** receives the request and verifies JWT
2. **Request Service** creates the request in its database
3. **Request Service** calls **Notification Service**
   - Sends notification to user
   - Receives confirmation
4. **Request Service** calls **Logging Service**
   - Logs the action for audit trail
   - Receives log confirmation
5. Returns complete response with all statuses

**Check the console output:**

- You'll see logs from Request Service showing it called Notification and Logging services
- Notification Service will show it sent a notification
- Logging Service will show it recorded the log

**What to explain:**

- "This demonstrates INTER-SERVICE COMMUNICATION"
- "Request Service made HTTP POST calls to two other services"
- "All services communicate asynchronously using REST/HTTP"
- "Each service is independent and can be deployed separately"
- "This is the key advantage of microservices architecture"

**Expected response:**

```json
{
  "message": "Request created successfully",
  "request": {
    "id": "1710750350000",
    "userId": "1710750234567",
    "userName": "Demo User",
    "userEmail": "demo@campus.com",
    "title": "Fix AC in Room 105",
    "description": "The air conditioning is not working...",
    "type": "maintenance",
    "status": "pending",
    "createdAt": "2026-03-17T11:25:50.000Z"
  },
  "notificationStatus": "notification_sent",
  "loggingStatus": "log_recorded"
}
```

---

## 📋 Step 4: Verify Data in Other Services (30 seconds)

Show that other services received the communication:

### Check Notifications:

```bash
curl http://localhost:3003/notify
```

**Response shows:**

```json
{
  "totalNotifications": 1,
  "notifications": [
    {
      "id": "1710750350001",
      "userId": "1710750234567",
      "userName": "Demo User",
      "requestId": "1710750350000",
      "title": "Fix AC in Room 105",
      "message": "New service request created: Fix AC in Room 105",
      "status": "sent",
      "timestamp": "2026-03-17T11:25:50.123Z"
    }
  ]
}
```

**What to say:** "See! Notification Service received and stored the notification."

### Check Logs:

```bash
curl http://localhost:3004/log
```

**Response shows:**

```json
{
  "totalLogs": 1,
  "logs": [
    {
      "id": "1710750350002",
      "service": "request-service",
      "action": "create_request",
      "requestId": "1710750350000",
      "userId": "1710750234567",
      "details": "User Demo User created request: Fix AC in Room 105",
      "timestamp": "2026-03-17T11:25:50.456Z"
    }
  ]
}
```

**What to say:** "Logging Service recorded the action for audit purposes."

---

## 🎯 Key Points to Emphasize

When explaining inter-service communication:

1. **Loose Coupling**: Each service doesn't know internal details of others
2. **Independent Scaling**: Can scale Request Service without scaling Notification Service
3. **Fault Tolerance**: If Notification Service is down, request still gets created (with timeout handling)
4. **Separation of Concerns**:
   - Auth Service: Only manages authentication
   - Request Service: Only manages requests
   - Notification Service: Only handles notifications
   - Logging Service: Only handles logging
5. **REST Communication**: Services use simple HTTP POST calls
6. **Asynchronous Feel**: Request Service waits for responses but doesn't get blocked

---

## 💡 Advanced Demo (if time allows)

### Load & View by User:

Get all requests for the user:

```bash
curl -X GET http://localhost:3002/request/1710750234567 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Get all notifications for the user:

```bash
curl http://localhost:3003/notify/1710750234567
```

Get all logs for the user:

```bash
curl http://localhost:3004/log/user/1710750234567
```

---

## 📊 Viva Questions (from Examiner)

### Q1: Explain inter-service communication in your project.

**Answer:**
"In our system, when a user creates a request in Request Service, it automatically calls Notification Service and Logging Service via HTTP POST requests. Request Service acts as orchestrator. It makes REST API calls to other services, waits for responses, and returns a combined response to the client. This is synchronous inter-service communication.

If you look at request.js, we use axios library to make these calls:

```javascript
const response = await axios.post(url, data, { timeout: 5000 });
```

Each service has its own database and runs independently on different ports. This is the microservices pattern - services communicate over network rather than shared memory."

### Q2: Why use microservices instead of monolithic architecture?

**Answer:**
"Benefits include:

1. **Scalability**: Can scale only the Request Service if it gets heavy load
2. **Independent Deployment**: Update Auth Service without redeploying others
3. **Technology Flexibility**: Could write one service in Python, another in Node
4. **Team Autonomy**: Different teams can work on different services
5. **Fault Isolation**: If Logging Service is down, requests still get created
6. **Language Agnostic**: Services just need to expose HTTP endpoints"

### Q3: How do you handle security between services?

**Answer:**
"We use JWT tokens for authentication. When user logs in, Auth Service issues a token. Request Service verifies this token before processing requests using middleware.

In production:

- Use HTTPS/TLS for inter-service communication
- Add API keys for service-to-service auth
- Implement rate limiting
- Use secrets management (HashiCorp Vault)
- Follow least privilege principle"

### Q4: What if a service call fails?

**Answer:**
"Our implementation has basic error handling:

```javascript
async function callService(url, data) {
  try {
    const response = await axios.post(url, data, { timeout: 5000 });
    return response.data;
  } catch (err) {
    console.error(`Error calling service ${url}:`, err.message);
    return { error: err.message };
  }
}
```

We have a 5-second timeout. If Notification Service is down:

- Request Service catches the error
- Still creates the request
- Returns error status on response
- Logs the failure

For production, we could:

- Implement circuit breaker pattern
- Use message queues (RabbitMQ/Kafka) for async communication
- Implement retry logic with exponential backoff"

### Q5: How does Docker help here?

**Answer:**
"Docker containerizes each service with its dependencies. Instead of installing Node, dependencies, etc manually, docker-compose brings up all services with one command:

```bash
docker-compose up
```

Benefits:

- **Consistency**: Works on my laptop, your laptop, and cloud server
- **Isolation**: Each service has its own filesystem and dependencies
- **Easy Deployment**: Docker images can be pushed to any cloud (AWS, Azure, Render)
- **Scaling**: Can run multiple instances of same container"

### Q6: What's the purpose of the Logging Service?

**Answer:**
"Logging Service maintains an audit trail of all activities across the system. When Request Service creates a request, it logs:

- Service name (request-service)
- Action (create_request)
- User ID
- Request ID
- Timestamp

This is useful for:

- Debugging production issues
- Compliance and audit requirements
- Monitoring system health
- Understanding user behavior

In production, logs would go to ELK stack or CloudWatch."

### Q7: Can services communicate asynchronously?

**Answer:**
"Currently we use synchronous calls. For async communication, we could use:

- **Message Queues**: RabbitMQ, Apache Kafka
- **Event Bus**: Publish-subscribe pattern
- **Service Mesh**: Istio for advanced communication

Async is useful when:

- Service doesn't need immediate response
- Want to decouple services more
- Handle bursty load better"

### Q8: How would you deploy this on AWS?

**Answer:**
"There are multiple approaches:

1. **AWS ECS (Elastic Container Service)**:
   - Push Docker images to ECR
   - Create task definitions
   - Create ECS service with load balancer
2. **AWS Lambda + API Gateway**:
   - Serverless deployment
   - But our services need persistent state (files), so not ideal

3. **AWS EC2 + Docker**:
   - Traditional VMs running Docker
   - Less efficient than ECS

4. **Container Orchestration (Kubernetes)**:
   - More complex but powerful
   - Auto-scaling, self-healing, rollbacks
   - EKS (Elastic Kubernetes Service) on AWS

For this assignment, ECS is recommended."

### Q9: What about the JWT token?

**Answer:**
"JWT (JSON Web Token) is stateless authentication:

1. User logs in with email/password
2. Auth Service verifies credentials, generates JWT
3. JWT contains user ID, email, expiry (24 hours)
4. Client sends JWT in Authorization header
5. Request Service verifies JWT signature
6. No need to query database each time

Benefits:

- Stateless (no session database needed)
- Scalable
- Can be used across services
- Signed and cannot be tampered"

### Q10: Performance concerns?

**Answer:**
"Current implementation:

- **Sequentiality**: Request creation waits for Notification AND Logging calls
- **Network latency**: Each HTTP call adds ~10-50ms

Improvements:

1. **Async calling**: Use Promise.all() instead of await
2. **Message queue**: Fire-and-forget instead of waiting
3. **Caching**: Cache user data to reduce calls
4. **Database optimization**: Use proper DB instead of JSON files
5. **Connection pooling**: Reuse HTTP connections"

---

## 🎬 Presentation Tips

1. **Start with architecture diagram**: Show how 4 services connect
2. **Then walk through a request**: Step by step from user to all services
3. **Live demo**: Actually run the demo, not just screenshots
4. **Show logs**: Console/file logs prove communication happened
5. **Explain not just 'what'** but 'why'
6. **Be ready for follow-up questions** about scalability, security, etc
7. **Total time**: Keep main demo to 3-5 minutes

---

## 📝 Sample Viva Opening

_"Good morning! I built a Smart Campus Service System using 4 microservices. Each service has a specific responsibility - Auth handles login, Request manages service requests, Notification sends alerts, and Logging maintains audit trail._

_The key feature is inter-service communication. When a user creates a maintenance request, the Request Service automatically notifies the user and logs the action by calling the other services via HTTP._

_Let me demonstrate this real quick..."_

---

**Good luck with your viva! You've got this! 🚀**
