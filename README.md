# Smart Campus Service System - Microservices Architecture

A student-friendly microservices project for Cloud Computing assignment. This system demonstrates inter-service communication, JWT authentication, and Docker containerization.

## 🎯 Project Overview

This is a 4-microservice system for managing campus service requests:

### Services:

1. **Auth Service** (Port 3001) - User registration and login
2. **Request Service** (Port 3002) - Create and manage service requests
3. **Notification Service** (Port 3003) - Handle notifications
4. **Logging Service** (Port 3004) - Log all activities

## 📁 Project Structure

```
CSTE ass 01/
├── auth-service/
│   ├── routes/
│   │   └── auth.js
│   ├── db/
│   │   └── users.json
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── .env
├── request-service/
│   ├── routes/
│   │   └── request.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db/
│   │   └── requests.json
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── .env
├── notification-service/
│   ├── routes/
│   │   └── notify.js
│   ├── logs/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── .env
├── logging-service/
│   ├── routes/
│   │   └── log.js
│   ├── logs/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
├── .env
├── .gitignore
└── .github/
    └── workflows/
        └── ci-cd.yml
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Postman or cURL (for testing APIs)

### Option 1: Run Locally (Without Docker)

#### 1. Install dependencies for all services:

```bash
# Auth Service
cd auth-service
npm install
cd ..

# Request Service
cd request-service
npm install
cd ..

# Notification Service
cd notification-service
npm install
cd ..

# Logging Service
cd logging-service
npm install
cd ..
```

#### 2. Start all services in separate terminals:

```bash
# Terminal 1: Auth Service
cd auth-service
npm start

# Terminal 2: Notification Service
cd notification-service
npm start

# Terminal 3: Logging Service
cd logging-service
npm start

# Terminal 4: Request Service
cd request-service
npm start
```

You should see:

```
✓ Auth Service started on port 3001
✓ Notification Service started on port 3003
✓ Logging Service started on port 3004
✓ Request Service started on port 3002
```

### Option 2: Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📡 API Usage Examples

### 1️⃣ Auth Service

#### Register a new user:

```bash
curl -X POST http://localhost:3001/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "message": "User registered successfully",
  "userId": "1710700800000",
  "email": "john@example.com"
}
```

#### Login:

```bash
curl -X POST http://localhost:3001/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1710700800000",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Verify token:

```bash
curl -X GET http://localhost:3001/auth/verify \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2️⃣ Request Service (Main Service)

#### Create a service request (requires JWT token):

```bash
curl -X POST http://localhost:3002/request \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{
    "title": "Fix water leakage in Building A",
    "description": "Water is leaking from the ceiling in Room 101. It started yesterday.",
    "type": "maintenance"
  }'
```

**Response (shows inter-service communication):**

```json
{
  "message": "Request created successfully",
  "request": {
    "id": "1710700900000",
    "userId": "1710700800000",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "title": "Fix water leakage in Building A",
    "description": "Water is leaking from the ceiling in Room 101...",
    "type": "maintenance",
    "status": "pending",
    "createdAt": "2026-03-17T10:15:00.000Z"
  },
  "notificationStatus": "notification_sent",
  "loggingStatus": "log_recorded"
}
```

#### Get user's requests:

```bash
curl -X GET http://localhost:3002/request/1710700800000 \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get all requests:

```bash
curl -X GET http://localhost:3002/request
```

### 3️⃣ Notification Service

Get all notifications:

```bash
curl -X GET http://localhost:3003/notify
```

Get user's notifications:

```bash
curl -X GET http://localhost:3003/notify/1710700800000
```

### 4️⃣ Logging Service

Get all logs:

```bash
curl -X GET http://localhost:3004/log
```

Get logs for a service:

```bash
curl -X GET http://localhost:3004/log/request-service
```

## 🔄 Inter-Service Communication Flow

When a user creates a request in **Request Service**:

```
1. Request Service receives POST /request
   ↓
2. Verifies JWT token (auth.js middleware)
   ↓
3. Creates request in database
   ↓
4. Calls Notification Service
   HTTP POST → http://localhost:3003/notify
   ├─ userId, userName, message
   ├─ Notification Service processes and logs
   └─ Returns confirmation
   ↓
5. Calls Logging Service
   HTTP POST → http://localhost:3004/log
   ├─ service, action, requestId, details
   ├─ Logging Service records in file/database
   └─ Returns confirmation
   ↓
6. Returns response to client with all statuses
```

## 🐳 Docker & Deployment

### Build individual services:

```bash
cd auth-service
docker build -t auth-service:latest .

cd request-service
docker build -t request-service:latest .

cd notification-service
docker build -t notification-service:latest .

cd logging-service
docker build -t logging-service:latest .
```

### Deploy on Cloud (AWS ECS / Azure / Render):

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

2. **Deploy to Render/Railway**:
   - Connect GitHub repo
   - Select docker-compose.yml
   - Deploy!

3. **Deploy on AWS ECS**:
   - Create ECR repositories
   - Push images: `aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URI>`
   - Create ECS cluster
   - Deploy with docker-compose

## 🔒 Security Features

- ✅ **JWT Authentication**: Token-based auth for request service
- ✅ **Password Hashing**: bcryptjs for secure password storage
- ✅ **Environment Variables**: Secrets in .env files (never committed)
- ✅ **CORS**: Enabled for cross-service communication
- ✅ **Input Validation**: Basic validation on all endpoints
- ✅ **Error Handling**: Graceful error responses

## 📊 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

- Installs dependencies for all services
- Runs tests (placeholder)
- Builds Docker images
- Code quality checks

Push to `main` or `develop` to trigger pipeline.

## 📚 API Documentation

Swagger files are available in each service:

- [auth-service/swagger.json](auth-service/swagger.json)
- [request-service/swagger.json](request-service/swagger.json)
- [notification-service/swagger.json](notification-service/swagger.json)
- [logging-service/swagger.json](logging-service/swagger.json)

View in [Swagger Editor](https://editor.swagger.io) by pasting file contents.

## 🔧 Environment Variables

Each service has a `.env` file. Key variables:

```
PORT=3001                    # Service port
JWT_SECRET=your-secret-key   # Secret for JWT (change in production!)
NODE_ENV=development         # Environment
NOTIFICATION_SERVICE_URL=... # Inter-service URLs
LOGGING_SERVICE_URL=...
```

## 💡 Testing the System

### Quick Test Script:

```bash
# 1. Register user
TOKEN=$(curl -s -X POST http://localhost:3001/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test User","email":"test@example.com","password":"pass123"}' | jq -r '.userId')

# Get token (note: register returns userId, not token)
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"pass123"}' | jq -r '.token')

# 2. Create request
curl -X POST http://localhost:3002/request \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"title":"Test Request","description":"Testing the system","type":"maintenance"}'

# 3. Check logs
curl http://localhost:3004/log

# 4. Check notifications
curl http://localhost:3003/notify
```

## 📝 Important Notes

- **Simple Implementation**: Code is intentionally simple for student understanding
- **File-based Database**: Uses JSON files (not production-ready; use MongoDB in production)
- **Console Logging**: Activities are logged to console for visibility
- **Error Handling**: Basic logging; enhance for production
- **No Authentication on Notification/Logging**: Services are open for simplicity

## 🎓 For Viva/Presentation

**Key Points to Explain**:

1. Why microservices? (Scalability, independent deployment, separation of concerns)
2. How inter-service communication works (HTTP REST calls with axios)
3. JWT authentication flow
4. Docker containerization benefits
5. CI/CD pipeline automation

**Demo**:

1. Register user
2. Create request (watch all 3 calls happen)
3. Check logs and notifications

## 📚 Resources

- [Express.js Docs](https://expressjs.com)
- [JWT.io](https://jwt.io)
- [Docker Docs](https://docs.docker.com)
- [Microservices Pattern](https://microservices.io)

## ❓ Troubleshooting

**Port already in use:**

```bash
# Kill process on port
lsof -i :3001
kill -9 <PID>
```

**Services can't communicate:**

- Check .env URLs are correct
- Ensure all services are running
- Use service name (not localhost) in docker-compose

**JWT token errors:**

- Token may have expired (24h expiry)
- Check Authorization header format: `Bearer TOKEN`

## 📄 License

MIT - Feel free to use this for learning!

---

**Good luck with your assignment!** 🚀 Feel free to reach out if you have questions.
