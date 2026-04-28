const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./openapi");

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;
const jwtSecret = process.env.JWT_SECRET || "super-secret-jwt";
const serviceToken = process.env.SERVICE_TOKEN || "internal-service-token";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const contracts = [];

const httpClient = axios.create({ timeout: 3000 });

async function requestWithRetry(requestFn, retries = 2, delayMs = 500) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
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

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function internalAuthMiddleware(req, res, next) {
  if (req.headers["x-service-token"] !== serviceToken) {
    return res.status(401).json({ message: "Unauthorized internal request" });
  }
  return next();
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "contract-service" });
});

app.post("/contracts/apply", authMiddleware, async (req, res) => {
  const { userId, title, details } = req.body;

  if (!userId || !title || !details) {
    return res.status(400).json({ message: "userId, title, and details are required" });
  }

  if (req.user.role !== "admin" && req.user.id !== userId) {
    return res.status(403).json({ message: "Cannot create contract for another user" });
  }

  try {
    await requestWithRetry(() =>
      httpClient.get(`${userServiceUrl}/internal/users/${userId}`, {
        headers: { "x-service-token": serviceToken }
      })
    );
  } catch (error) {
    return res.status(400).json({ message: "User validation failed" });
  }

  const contract = {
    id: uuidv4(),
    userId,
    title,
    details,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    approvedAt: null
  };

  contracts.push(contract);
  return res.status(201).json({ message: "Contract application submitted", contract });
});

app.get("/contracts", authMiddleware, (req, res) => {
  if (req.user.role === "admin") {
    return res.json(contracts);
  }

  return res.json(contracts.filter((contract) => contract.userId === req.user.id));
});

app.put("/contracts/:id/approve", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can approve contracts" });
  }

  const contract = contracts.find((entry) => entry.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ message: "Contract not found" });
  }

  if (contract.status === "APPROVED") {
    return res.status(400).json({ message: "Contract already approved" });
  }

  contract.status = "APPROVED";
  contract.approvedAt = new Date().toISOString();

  try {
    await requestWithRetry(() =>
      httpClient.post(
        `${notificationServiceUrl}/notify`,
        {
          userId: contract.userId,
          type: "CONTRACT_APPROVED",
          message: `Your contract \"${contract.title}\" has been approved.`
        },
        {
          headers: { "x-service-token": serviceToken }
        }
      )
    );
  } catch (error) {
    console.error("Failed to notify contract approval:", error.message);
  }

  return res.json({ message: "Contract approved", contract });
});

app.get("/internal/contracts/:id", internalAuthMiddleware, (req, res) => {
  const contract = contracts.find((entry) => entry.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ message: "Contract not found" });
  }

  return res.json(contract);
});

app.listen(port, () => {
  console.log(`Contract service running on port ${port}`);
});
