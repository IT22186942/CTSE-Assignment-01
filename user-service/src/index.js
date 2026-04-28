const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
const openApiSpec = require("./openapi");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || "super-secret-jwt";
const serviceToken = process.env.SERVICE_TOKEN || "internal-service-token";

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

const users = [];

function validateEmail(email) {
  return typeof email === "string" && /.+@.+\..+/.test(email);
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
  res.json({ status: "ok", service: "user-service" });
});

app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !validateEmail(email) || !password || password.length < 6) {
    return res.status(400).json({
      message: "Invalid input. Name, valid email, and password (min 6 chars) are required."
    });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role: role === "admin" ? "admin" : "student"
  };

  users.push(newUser);

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email) || !password) {
    return res.status(400).json({ message: "Valid email and password are required" });
  }

  const user = users.find((entry) => entry.email === email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "2h" }
  );

  return res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.get("/users/:id", authMiddleware, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (req.user.role !== "admin" && req.user.id !== user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.get("/internal/users/:id", internalAuthMiddleware, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    valid: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.listen(port, () => {
  console.log(`User service running on port ${port}`);
});
