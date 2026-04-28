const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./openapi");

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;
const jwtSecret = process.env.JWT_SECRET || "super-secret-jwt";
const serviceToken = process.env.SERVICE_TOKEN || "internal-service-token";

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const notifications = [];

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
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/notify", internalAuthMiddleware, (req, res) => {
  const { userId, message, type } = req.body;

  if (!userId || !message || !type) {
    return res.status(400).json({ message: "userId, message, and type are required" });
  }

  const notification = {
    id: uuidv4(),
    userId,
    message,
    type,
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);
  return res.status(201).json({ message: "Notification stored", notification });
});

app.get("/notifications", authMiddleware, (req, res) => {
  const { userId } = req.query;
  const filtered = userId
    ? notifications.filter((item) => item.userId === userId)
    : notifications;

  return res.json(filtered);
});

app.listen(port, () => {
  console.log(`Notification service running on port ${port}`);
});
