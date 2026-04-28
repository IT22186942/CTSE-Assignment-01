# VIVA PANEL COMMANDS

This file gives the exact commands and display order for the viva panel.

---

## 1) Start the application

Run this from the project root in PowerShell:

```powershell
cd "c:\Users\EMC\OneDrive\Desktop\CSTE ASS01"
docker compose up --build
```

What to show:

- All 4 services starting
- Frontend starting
- Health checks becoming healthy

---

## 2) Show container status

```powershell
docker compose ps
```

What to say:

- Each service is containerized
- Docker Compose is orchestrating the system
- Healthy status proves readiness

---

## 3) Show logs

```powershell
docker compose logs --tail=20
docker compose logs -f contract-service
```

What to show:

- Service startup messages
- Any service-to-service calls
- Error handling if needed

---

## 4) Show API docs in browser

Open these tabs:

- http://localhost:3001/api-docs
- http://localhost:3002/api-docs
- http://localhost:3003/api-docs
- http://localhost:3004/api-docs

What to say:

- Each microservice has its own OpenAPI contract
- This supports independent deployment and testing

---

## 5) Show GitHub Actions workflow

Open your GitHub repository in browser and go to:

- Repository → Actions tab
- Open the latest successful run
- Show job logs for build steps

What to highlight:

- Dependency install
- Frontend build
- Docker image build
- CI is working on push

Suggested line to say:
"This is my CI build run. It proves the code is version-controlled and automatically verified on each push."

---

## 6) Show a live integration flow

If you want to demonstrate actual service communication, run:

```powershell
node .\scripts\e2e-check.js
```

What this does:

- Registers student and admin users
- Logs them in
- Applies for a contract
- Approves the contract
- Makes payment
- Verifies notifications

What to say:

- This proves inter-service communication end to end
- It shows the system working beyond static screenshots

---

## 7) Show the main demo sequence quickly

If examiner asks for a short demo, use:

```powershell
docker compose ps
docker compose logs --tail=20
node .\scripts\e2e-check.js
```

Suggested viva explanation:

"I will first show the containers are healthy, then the logs, then the end-to-end check. After that I can explain the Azure deployment plan, which was not completed because of subscription limitations."

---

## 8) What to keep open during viva

- VS Code terminal with Docker Compose
- Browser with Swagger docs
- GitHub Actions page
- This command sheet

---

## 9) Final speaking order

1. Explain project briefly
2. Show `docker compose ps`
3. Open Swagger docs
4. Show GitHub Actions
5. Run `node .\scripts\e2e-check.js`
6. Explain Azure as planned future work
