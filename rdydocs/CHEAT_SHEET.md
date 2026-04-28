# VIVA CHEAT SHEET - ONE PAGE REFERENCE

_Print this page and keep it accessible during viva preparation_

---

## 🎯 PROJECT IN 30 SECONDS

**Smart Mall Management System** - Microservices demo showing:

- 4 independent services (User, Contract, Payment, Notification)
- REST API communication between services
- JWT authentication + bcrypt password hashing
- Docker containerization + GitHub Actions CI build
- In-memory storage (would be MongoDB in production)

---

## 🏗️ ARCHITECTURE QUICK VIEW

```
FRONTEND (React) :5173
    ↓
[PORT 3001] USER SERVICE → User registration, login, JWT auth
[PORT 3002] CONTRACT SERVICE → Apply, approve contracts, ent Services (if asked)
[PORT 3003] PAYMENT SERVICE → Process payments
[PORT 3004] NOTIFICATION SERVICE → Store & retrieve notifications
```

---

## 🔑 KEY CONCEPTS - MEMORIZE THESE

| Concept                   | What                                     | Why                                             |
| ------------------------- | ---------------------------------------- | ----------------------------------------------- |
| **JWT**                   | Token with user info + signature         | Stateless auth, perfect for microservices       |
| **bcrypt**                | One-way password hashing (10 rounds)     | Can't reverse, prevents rainbow tables          |
| **Microservices**         | Independent services via HTTP            | Scalable, fault-isolated, deployable separately |
| **Docker**                | Container for application + dependencies | "Works on my machine" problem solved            |
| **docker-compose**        | Orchestrate multiple containers          | One command starts everything (up --build)      |
| **x-service-token**       | Service-to-service auth header           | Prevents external unauthorized calls            |
| **Eventually Consistent** | Data syncs over time                     | Accept brief inconsistency for availability     |

---

## 📋 THE 4 SERVICES - ONE SENTENCE EACH

1. **User Service (3001)**: Register, login, JWT tokens, bcrypt hashing, role-based access
2. **Contract Service (3002)**: Apply contracts (validates user), approve (sends notification), store status
3. **Payment Service (3003)**: Process payments (validates contract), record transaction, send notification
4. **Notification Service (3004)**: Store & retrieve notifications for users (simple, no dependencies)

---

## 🔐 SECURITY LAYERS - QUICK RUNDOWN

**Layer 1**: JWT on login (2-hour expiry) + token in localStorage
**Layer 2**: Password hashing with bcrypt (never plain text)
**Layer 3**: Role-based checks (admin vs student)
**Layer 4**: Service-to-service `x-service-token` header
**Layer 5**: Input validation (email format, positive amounts)
**Layer 6**: CORS enabled for frontend
**Layer 7**: Error messages don't leak sensitive info

---

## 🔄 DEFAULT WORKFLOW - KNOW THIS COLD

1. **Register** → Bcrypt hash password → Store user → Ready to login
2. **Login** → Verify password → JWT issued → Token sent to browser
3. **Apply Contract** → Contract Service calls User Service → Validates → Creates contract (PENDING)
4. **Approve Contract** → Admin approves → Status→APPROVED → Notifies user → Notification sent
5. **Make Payment** → Calls Contract Service → Verifies APPROVED → Creates payment → Notifies user

---

## 💬 ELEVATOR PITCH (60 SECONDS)

"I built a Smart Mall Management System using microservices architecture. It has 4 backend services built with Node.js + Express that communicate via REST APIs. The frontend is React + Vite. Users authenticate with JWT tokens, passwords are hashed with bcrypt. Services call each other with resilience - if User Service is down, other services gracefully handle it. Everything is containerized with Docker and orchestrated with docker-compose. The entire system starts with one command. Data is stored in-memory for demo purposes but easily replaceable with MongoDB. I implemented GitHub Actions for CI/CD to automatically build and test on every push. The system demonstrates key cloud computing concepts: microservices architecture, distributed systems, containerization, and DevOps practices."

---

## 🎬 DEMO COMMANDS - COPY THESE

**Terminal setup (keep running):**

```bash
docker compose up --build
```

**Then in another terminal, these 3 commands show complete workflow:**

```bash
# 1. User flow
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@mail.com","password":"pass123","role":"student"}'

# 2. Contract application
curl -X POST http://localhost:3002/contracts/apply \
  -H "Authorization: Bearer {TOKEN_FROM_LOGIN}" \
  -H "Content-Type: application/json" \
  -d '{"userId":"{USER_ID}","title":"Internship","details":"6-month internship"}'

# 3. View notifications
curl -X GET "http://localhost:3004/notifications?userId={USER_ID}" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## ❌ COMMON PITFALLS - DON'T SAY THESE

| Wrong                                     | Fix                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| "It's just a Node.js app"                 | "It's a microservices system demonstrating distributed architecture"            |
| "JWT stores encrypted data"               | "JWT is Base64 encoded (not encrypted) but cryptographically signed"            |
| "If any service fails, system works fine" | "If User Service fails, dependent services fail; notification fails gracefully" |
| "In-memory storage is production-ready"   | "In-memory is for learning; production would use MongoDB/PostgreSQL"            |
| "Docker doesn't need health checks"       | "Health checks ensure services ready before dependents start"                   |

---

## 🎓 TOP 10 Q&A - SUPER QUICK

**Q: Why microservices?** A: Scalable independently, fault-isolated, deploy separately, technology flexible
**Q: How are passwords stored?** A: Never plain text. Bcrypt with 10 salt rounds = one-way hash
**Q: What's JWT for?** A: Stateless authentication. User gets token with expiry, sends with requests
**Q: How do services communicate?** A: HTTP REST with Axios. Retry logic (2x, 500ms delay) for resilience
**Q: What's x-service-token?** A: Shared secret for service-to-service calls. Prevents external unauthorized access
**Q: If payment service crashes?** A: Notifications fail gracefully; payments blocked; retry when up
**Q: How scale to 1M users?** A: Load balancers, database, caching, message queues, API gateway, auto-scaling
**Q: Docker vs Kubernetes?** A: Docker = containerization (we use). Kubernetes = orchestration (production)
**Q: Why not monolith?** A: Hard to scale specific services, tight coupling, one bug breaks all
**Q: CAP theorem?** A: Choose 2 of 3: Consistency, Availability, Partition. We choose A+P (eventual consistency)

---

## 🚀 PRODUCTION CHANGES - ONE-LINERS

- In-memory → MongoDB (persistent, queryable, scalable)
- REST → gRPC (faster service communication)
- Health checks → Kubernetes (automatic scaling, healing)
- GitHub Actions → Jenkins/GitLab CI (more control)
- Logs to console → ELK Stack (searchable, analyzable)
- No cache → Redis (faster queries)
- Sync notifications → Message Queue (Kafka, RabbitMQ)

---

## 📊 NUMBERS TO REMEMBER

| Item                      | Value                                   |
| ------------------------- | --------------------------------------- |
| User Service Port         | 3001                                    |
| Contract Service Port     | 3002                                    |
| Payment Service Port      | 3003                                    |
| Notification Service Port | 3004                                    |
| Frontend Port             | 5173                                    |
| JWT Expiry                | 2 hours                                 |
| Bcrypt Rounds             | 10 (2^10 = 1024 iterations)             |
| Retry Attempts            | 2 retries                               |
| Retry Delay               | 500ms                                   |
| Timeout                   | 3000ms (3 seconds)                      |
| Health Check Interval     | 10 seconds                              |
| Total Services            | 4 backend + 1 frontend = 5              |
| Tech Stack Services       | 4 microservices                         |
| Users Array               | In-memory (reevaluates on each request) |

---

## ✅ FINAL CHECKLIST - 1 HOUR BEFORE VIVA

- [ ] Docker compose running (`docker compose up --build`)
- [ ] Services all showing healthy (check with `docker compose ps`)
- [ ] Can curl one endpoint successfully
- [ ] Ports accessible: localhost:3001, 3002, 3003, 3004, 5173
- [ ] Read QUICK_REFERENCE one more time
- [ ] Memorized 4 service names and ports
- [ ] Know 60-second pitch
- [ ] Calm, confident, ready to demo

---

## 🎯 DURING VIVA - QUICK REMINDERS

✅ Listen completely before answering
✅ Explain your 'why' not just 'what'
✅ Use real examples from code
✅ Draw diagrams if explaining complex concept
✅ Admit gaps: "I would implement..."
✅ Show the demo (it's your trump card!)
✅ Connect to real-world: "Netflix uses..."
✅ Ask for clarification if unsure

---

## 📞 LAST-SECOND HELP

**Q: Examiner asks about something you don't know?**
A: "That's interesting. In our current implementation we focused on X, but for production I would approach it by..."

**Q: Demo doesn't work?**
A: "Let me check the logs. During development this worked consistently. Let me verify the service health..."

**Q: Forgot a technical detail?**
A: "I want to give you accurate info. I believe it's X, but let me confirm by checking the code..."

**Q: Stuck on a question?**
A: "Can you clarify what aspect you're interested in? The architecture perspective or implementation perspective?"

---

## 🏆 SUCCESS =

Know your project deeply + Explain clearly + Demo works + Think critically = **PASS! ✅**

**YOU'VE GOT THIS! 💪**

---

_Print this page. Keep it accessible. Reference before and after viva begins._
_This is your quick guide to 4 months of project work. Own it!_
