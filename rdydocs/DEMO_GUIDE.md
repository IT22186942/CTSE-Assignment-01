# VIVA DEMO GUIDE - Step-by-Step

Use this guide to demonstrate your project during viva. All commands can be copy-pasted.

---

## 🎬 DEMO SETUP

### Prerequisites

- Docker and Docker Compose installed
- Terminal open in project root directory
- Internet connection (might need for Docker image download first time)

### Initial Setup

```bash
# Navigate to project root
cd "c:\Users\EMC\OneDrive\Desktop\CSTE ASS01"

# Start all services
docker compose up --build

# Wait for these messages:
# user-service running on port 3001
# contract-service running on port 3002
# payment-service running on port 3003
# notification-service running on port 3004
# frontend running on port 5173
```

---

## 🖥️ HOW TO SHOW THE VIVA PANEL

Use this sequence during viva to show the panel clearly:

1. Open the project in VS Code and keep the terminal visible.
2. Run `docker compose up --build` in the terminal.
3. Open the browser on the API docs pages.
4. Open GitHub in the browser and show the Actions tab.
5. Show the successful workflow run.
6. Show the terminal logs and health checks.

### Useful commands to show on screen

```bash
docker compose ps
docker compose logs --tail=20
docker compose logs -f user-service
```

### Browser tabs to keep ready

- http://localhost:3001/api-docs
- http://localhost:3002/api-docs
- http://localhost:3003/api-docs
- http://localhost:3004/api-docs
- Your GitHub repository → Actions tab

### What to say

"I can show the local microservices running, the API documentation, and the GitHub Actions build run. Azure deployment was planned, but I could not complete it because of subscription limitations."

---

## 📝 DEMO FLOW (5 minutes)

### Part 1: Show the Architecture (1 minute)

**Show the file structure:**

```bash
# In new terminal window (without closing docker compose up)
ls -la
# Show folders: user-service, contract-service, payment-service, notification-service, frontend, .github/, docker-compose.yml
```

**Explain while showing:**
"You can see 4 microservices folders plus frontend. Each service is independent. Let me show you they're all running via Swagger documentation."

---

### Part 2: Show Service Health & Documentation (1 minute)

**Open in browser (while docker compose running):**

1. **User Service API Docs**: http://localhost:3001/api-docs
   - Shows Register, Login, Get User endpoints
   - Show the curl examples

2. **Contract Service API Docs**: http://localhost:3002/api-docs
   - Shows Apply Contract, Get Contracts, Approve endpoints

3. **Payment Service API Docs**: http://localhost:3003/api-docs
   - Shows Pay, Get Payments endpoints

4. **Notification Service API Docs**: http://localhost:3004/api-docs
   - Shows Notify, Get Notifications endpoints

**Explain:**
"Each service has its own API documentation. Services are completely independent. If one fails, others continue. This is key advantage of microservices."

---

### Part 3: Complete User Journey (2 minutes)

Open a new terminal for API calls (keep docker-compose running).

#### Step 1: Register a Student User

```bash
# Save this response to get the USER_ID
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@smartmall.com",
    "password": "SecurePass123",
    "role": "student"
  }'
```

**Response should be:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "some-uuid",
    "name": "Alice Johnson",
    "email": "alice@smartmall.com",
    "role": "student"
  }
}
```

**Copy the `id` value. In next commands replace `{STUDENT_ID}` with it.**

---

#### Step 2: Login as Student

```bash
# This will give you a JWT token
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@smartmall.com",
    "password": "SecurePass123"
  }'
```

**Response should be:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Copy the `token` value. In next commands replace `{STUDENT_TOKEN}` with it.**

**Explain:**
"The token is a JWT. It contains user info and is cryptographically signed. When I add this to requests, the server knows who I am without storing my session."

---

#### Step 3: Student Applies for Contract

```bash
# Replace {STUDENT_ID} with actual ID from Step 1
curl -X POST http://localhost:3002/contracts/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {STUDENT_TOKEN}" \
  -d '{
    "userId": "{STUDENT_ID}",
    "title": "Smart Mall Internship",
    "details": "6-month internship with benefits"
  }'
```

**Response should be:**

```json
{
  "message": "Contract application submitted",
  "contract": {
    "id": "contract-uuid",
    "userId": "...",
    "title": "Smart Mall Internship",
    "details": "6-month internship with benefits",
    "status": "PENDING",
    "createdAt": "2024-...",
    "approvedAt": null
  }
}
```

**Copy the contract `id`. In next commands replace `{CONTRACT_ID}` with it.**

**Behind the scenes explanation:**
"Contract Service just called User Service to validate this user exists. User Service responded with the user data. That's service-to-service communication."

---

#### Step 4: View Pending Contracts

```bash
curl -X GET http://localhost:3002/contracts \
  -H "Authorization: Bearer {STUDENT_TOKEN}"
```

**Response should be:**

```json
[
  {
    "id": "contract-uuid",
    "userId": "...",
    "title": "Smart Mall Internship",
    "details": "6-month internship with benefits",
    "status": "PENDING",
    ...
  }
]
```

**Explain:**
"Status is PENDING. Admin needs to approve it before payment can be made. Let me demonstrate admin approval."

---

#### Step 5: Register and Login as Admin

```bash
# Register admin
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Manager",
    "email": "admin@smartmall.com",
    "password": "AdminPass123",
    "role": "admin"
  }'
```

```bash
# Login as admin
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@smartmall.com",
    "password": "AdminPass123"
  }'
```

**Copy the admin token. Replace `{ADMIN_TOKEN}` in next commands.**

---

#### Step 6: Admin Approves Contract

```bash
# Replace {CONTRACT_ID} with actual contract ID
# Replace {ADMIN_TOKEN} with actual admin token
curl -X PUT http://localhost:3002/contracts/{CONTRACT_ID}/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Response should be:**

```json
{
  "message": "Contract approved",
  "contract": {
    "id": "contract-uuid",
    "userId": "...",
    "title": "Smart Mall Internship",
    "details": "6-month internship with benefits",
    "status": "APPROVED",
    "createdAt": "2024-...",
    "approvedAt": "2024-..T...Z"
  }
}
```

**Behind the scenes explanation:**
"When I approved, Contract Service called Notification Service and sent a notification. Let me show you."

---

#### Step 7: Check Student's Notifications

```bash
# Replace {STUDENT_ID} with actual student ID
curl -X GET "http://localhost:3004/notifications?userId={STUDENT_ID}" \
  -H "Authorization: Bearer {STUDENT_TOKEN}"
```

**Response should be:**

```json
[
  {
    "id": "notification-uuid",
    "userId": "...",
    "message": "Your contract \"Smart Mall Internship\" has been approved.",
    "type": "CONTRACT_APPROVED",
    "createdAt": "2024-..T...Z"
  }
]
```

**Explain:**
"See? Notification was automatically sent when contract was approved. Notification Service received an internal call from Contract Service using `x-service-token` header for authentication."

---

#### Step 8: Student Makes Payment

```bash
# Only possible because contract is APPROVED
curl -X POST http://localhost:3003/payments/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {STUDENT_TOKEN}" \
  -d '{
    "contractId": "{CONTRACT_ID}",
    "amount": 50000,
    "userId": "{STUDENT_ID}"
  }'
```

**Response should be:**

```json
{
  "message": "Payment successful",
  "payment": {
    "id": "payment-uuid",
    "contractId": "...",
    "userId": "...",
    "amount": 50000,
    "status": "PAID",
    "createdAt": "2024-..T...Z"
  }
}
```

**Behind the scenes explanation:**
"Payment Service verified the contract is APPROVED, then called Notification Service to send a payment confirmation."

---

#### Step 9: Check Updated Notifications

```bash
curl -X GET "http://localhost:3004/notifications?userId={STUDENT_ID}" \
  -H "Authorization: Bearer {STUDENT_TOKEN}"
```

**Response should now include 2 notifications:**

```json
[
  {
    "id": "...",
    "userId": "...",
    "message": "Your contract \"Smart Mall Internship\" has been approved.",
    "type": "CONTRACT_APPROVED",
    "createdAt": "2024-..."
  },
  {
    "id": "...",
    "userId": "...",
    "message": "Payment of 50000 completed for contract contract-uuid.",
    "type": "PAYMENT_SUCCESS",
    "createdAt": "2024-..."
  }
]
```

**Final Explanation:**
"Perfect! We've completed the entire workflow:

1. Student registered and logged in (JWT authentication)
2. Applied for contract (Contract Service validated user with User Service)
3. Admin approved contract (triggered notification)
4. Student checked notifications (Notification Service)
5. Student made payment (Payment Service validated contract)
6. Student received payment confirmation (another notification)

All 4 services worked together seamlessly. This demonstrates microservices communication."

---

### Part 4: Show Error Handling (1 minute)

#### Test Error 1: Try to pay without approval

```bash
# First, create a new contract but DON'T approve it
curl -X POST http://localhost:3002/contracts/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {STUDENT_TOKEN}" \
  -d '{
    "userId": "{STUDENT_ID}",
    "title": "Another Contract",
    "details": "Test contract"
  }'
```

Copy the new contract ID. Then try to pay:

```bash
# This should fail
curl -X POST http://localhost:3003/payments/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {STUDENT_TOKEN}" \
  -d '{
    "contractId": "{NEW_CONTRACT_ID}",
    "amount": 5000,
    "userId": "{STUDENT_ID}"
  }'
```

**Response should be error:**

```json
{
  "message": "Payment allowed only for approved contracts"
}
```

**Explain:**
"Validation prevented invalid payment. Business logic requires APPROVED status."

---

#### Test Error 2: Only admin can approve

```bash
# Try to approve as student (using student token)
curl -X PUT http://localhost:3002/contracts/{SOME_CONTRACT_ID}/approve \
  -H "Authorization: Bearer {STUDENT_TOKEN}"
```

**Response should be error:**

```json
{
  "message": "Only admin can approve contracts"
}
```

**Explain:**
"Role-based authorization prevents unauthorized operations."

---

#### Test Error 3: Invalid token

```bash
# Try with invalid token
curl -X GET http://localhost:3001/users/{STUDENT_ID} \
  -H "Authorization: Bearer invalid-token"
```

**Response should be error:**

```json
{
  "message": "Invalid or expired token"
}
```

**Explain:**
"JWT verification prevents unauthorized access. Token signature is validated."

---

## 🐳 Docker Compose Features Demo (30 seconds)

In a third terminal while services are running:

```bash
# Show running containers
docker compose ps

# Output shows:
# NAME                COMMAND              STATUS              PORTS
# user-service        "node src/index..."  Up (healthy)        0.0.0.0:3001->3001/tcp
# contract-service    "node src/index..."  Up (healthy)        0.0.0.0:3002->3002/tcp
# payment-service     "node src/index..."  Up (healthy)        0.0.0.0:3003->3003/tcp
# notification-service "node src/index..."  Up (healthy)        0.0.0.0:3004->3004/tcp
# frontend            "nginx -g daemon..."  Up (healthy)        0.0.0.0:5173->80/tcp
```

**Explain:**
"All services show healthy status with auto health checks. No manual server management needed."

View logs:

```bash
# View logs from all services
docker compose logs --tail=20

# Or specific service
docker compose logs -f contract-service
```

**Explain:**
"Easy to see what each service is doing and debug issues."

---

## 📊 Show Code Examples (Optional - if asked)

### Show Authentication Flow

**File**: `user-service/src/index.js`

```javascript
// Registration
app.post("/register", async (req, res) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  // Password hashed before storage

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "2h" },
  );
  // JWT issued with 2-hour expiry
});

// Protected route
function authMiddleware(req, res, next) {
  const token = authHeader.split(" ")[1];
  req.user = jwt.verify(token, jwtSecret);
  // Token verified before allowing access
}
```

**Explain:**
"Passwords never stored plain. JWT issued. Token verified on each request."

---

### Show Service-to-Service Communication

**File**: `contract-service/src/index.js`

```javascript
// Validate user in User Service
const response = await httpClient.get(
  `${userServiceUrl}/internal/users/${userId}`,
  {
    headers: { "x-service-token": serviceToken },
  },
);

// Retry logic for resilience
async function requestWithRetry(requestFn, retries = 2, delayMs = 500) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
```

**Explain:**
"Services call each other. Retry logic handles transient failures. x-service-token prevents unauthorized calls."

---

### Show Docker Compose

**File**: `docker-compose.yml`

```yaml
services:
  contract-service:
    build: ./contract-service
    environment:
      USER_SERVICE_URL: http://user-service:3001
    depends_on:
      user-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch(...)"]
      interval: 10s
```

**Explain:**
"Services know each other by name (service_name:port). Dependencies ensure startup order. Health checks verify readiness."

---

## 🎯 Demo Talking Points

### Points to Emphasize:

1. **Microservices Architecture**
   - "4 independent services communicate via REST"
   - "Each service can scale separately"
   - "Failure in one doesn't crash others"

2. **Security**
   - "JWT for stateless authentication"
   - "Bcrypt for password hashing"
   - "Role-based authorization"
   - "x-service-token for internal calls"

3. **Resilience**
   - "Retry logic handles transient failures"
   - "Health checks ensure service readiness"
   - "Graceful error handling"

4. **DevOps**
   - "Docker for containerization"
   - "Compose for orchestration"
   - "GitHub Actions for CI/CD"

5. **Scalability**
   - "Easy to add services"
   - "Easy to scale individual services"
   - "Replace in-memory with database"
   - "Add API Gateway for routing"

---

## 🚨 Common Issues During Demo

### Issue: Services not starting

**Solution:**

```bash
# Clear old containers
docker compose down

# Rebuild
docker compose up --build

# Give it 30 seconds to fully start
```

### Issue: Port already in use

**Solution:**

```bash
# Find process on port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: API calls not working

**Solution:**

```bash
# Check services are running
docker compose ps

# Check logs
docker compose logs

# Verify using browser
curl http://localhost:3001/health
```

---

## ⏱️ TIME MANAGEMENT

- **Intro (30s)**: Quick overview of project
- **Show Architecture (30s)**: File structure and services
- **API Docs (1 min)**: Show 4 Swagger endpoints
- **Complete Workflow (2 min)**: Register → Apply → Approve → Pay → Notify
- **Error Handling (1 min)**: Show 2-3 validation errors
- **Docker Demo (30s)**: Show `docker compose ps` and logs
- **Code walkthrough (30s)**: If time allows
- **Questions**: Answer follow-up questions

**Total: ~6-7 minutes** (leaves 3-4 minutes for viva questions)

---

## 💡 Pro Tips

1. **Test before viva**: Run through this guide once to ensure everything works
2. **Have two terminals open**: One for docker-compose, one for API calls
3. **Copy actual IDs/tokens**: Replace placeholders with real values from responses
4. **Show error handling**: Demonstrates robustness and thought
5. **Explain trade-offs**: "In production, I would use MongoDB instead of in-memory"
6. **Connect to concepts**: "This is eventual consistency" or "CAP theorem"
7. **Have Markdown files open**: For reference during Q&A

---

Good luck with your viva! 🎯
