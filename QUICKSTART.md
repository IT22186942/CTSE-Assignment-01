# Quick Start Guide

Get the Smart Campus Service System running in 2 minutes!

## 🚀 Fastest Way to Run Locally

### Step 1: Install Dependencies (takes ~1-2 minutes)

```bash
# Run this from root directory
cd auth-service && npm install && cd ..
cd request-service && npm install && cd ..
cd notification-service && npm install && cd ..
cd logging-service && npm install && cd ..
```

Or create a script `install-all.sh`:

```bash
#!/bin/bash
for dir in auth-service request-service notification-service logging-service; do
  echo "Installing $dir..."
  cd $dir
  npm install
  cd ..
done
echo "✓ All dependencies installed!"
```

Run it: `bash install-all.sh`

### Step 2: Start All Services

Open 4 terminals:

**Terminal 1:**

```bash
cd auth-service
npm start
```

**Terminal 2:**

```bash
cd request-service
npm start
```

**Terminal 3:**

```bash
cd notification-service
npm start
```

**Terminal 4:**

```bash
cd logging-service
npm start
```

Wait for all to show "Service started" messages.

### Step 3: Test with Postman (2 minutes)

1. Import `Postman_Collection.json` into Postman
2. Run requests in order:
   - Register User (Auth Service)
   - Login User (Auth Service) - copies token automatically
   - Create Request (Request Service) - triggers inter-service calls!
   - Check Notifications (Notification Service)
   - Check Logs (Logging Service)

Done! ✅

---

## 🐳 Run with Docker Compose (Easiest!)

```bash
docker-compose up
```

That's it! All services start. Press Ctrl+C to stop.

---

## 📋 Troubleshooting

**npm not found:**

- Install Node.js from nodejs.org
- Verify: `node -v` and `npm -v`

**Port already in use:**

```bash
# Kill process on port
lsof -i :3001      # Check what's using port
kill -9 <PID>      # Kill it
```

**Services not talking to each other:**

- Make sure all 4 are running
- Check .env files have correct URLs
- Use `http://localhost:PORT` when testing locally

**"Cannot find module" errors:**

- Did you run `npm install`?
- Check you're in correct directory

---

## ✅ Quick Verification

Once all running, test:

```bash
# All should return status 200
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

---

## 🎯 Next Steps

1. Read [README.md](README.md) for full documentation
2. Check [DEMO_GUIDE.md](DEMO_GUIDE.md) for viva preparation
3. Review code in each service
4. Experiment with API calls
5. Look at logs in `logging-service/logs/`

---

## 💡 Pro Tips

- Use VS Code terminal to run multiple services
- Install JSON formatter extension for pretty printing responses
- Use Postman for testing (provides nice UI)
- Check console output to see inter-service communication
- Look at `db/` and `logs/` folders to see data stored

---

**You're ready! Good luck! 🚀**
