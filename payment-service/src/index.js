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
const port = process.env.PORT || 3003;
const jwtSecret = process.env.JWT_SECRET || "super-secret-jwt";
const serviceToken = process.env.SERVICE_TOKEN || "internal-service-token";
const contractServiceUrl = process.env.CONTRACT_SERVICE_URL || "http://localhost:3002";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const payments = [];

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

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.post("/payments/pay", authMiddleware, async (req, res) => {
  const { contractId, amount, userId } = req.body;

  if (!contractId || !amount || Number(amount) <= 0 || !userId) {
    return res.status(400).json({ message: "contractId, userId and positive amount are required" });
  }

  if (req.user.role !== "admin" && req.user.id !== userId) {
    return res.status(403).json({ message: "Cannot make payment for another user" });
  }

  let contract;
  try {
    const response = await requestWithRetry(() =>
      httpClient.get(`${contractServiceUrl}/internal/contracts/${contractId}`, {
        headers: { "x-service-token": serviceToken }
      })
    );
    contract = response.data;
  } catch (error) {
    return res.status(400).json({ message: "Contract validation failed" });
  }

  if (contract.status !== "APPROVED") {
    return res.status(400).json({ message: "Payment allowed only for approved contracts" });
  }

  if (contract.userId !== userId) {
    return res.status(400).json({ message: "Contract does not belong to this user" });
  }

  const payment = {
    id: uuidv4(),
    contractId,
    userId,
    amount: Number(amount),
    status: "PAID",
    createdAt: new Date().toISOString()
  };

  payments.push(payment);

  try {
    await requestWithRetry(() =>
      httpClient.post(
        `${notificationServiceUrl}/notify`,
        {
          userId,
          type: "PAYMENT_SUCCESS",
          message: `Payment of ${payment.amount} completed for contract ${contractId}.`
        },
        {
          headers: { "x-service-token": serviceToken }
        }
      )
    );
  } catch (error) {
    console.error("Failed to notify payment:", error.message);
  }

  return res.status(201).json({ message: "Payment successful", payment });
});

app.get("/payments", authMiddleware, (req, res) => {
  if (req.user.role === "admin") {
    return res.json(payments);
  }

  return res.json(payments.filter((entry) => entry.userId === req.user.id));
});

app.listen(port, () => {
  console.log(`Payment service running on port ${port}`);
});
