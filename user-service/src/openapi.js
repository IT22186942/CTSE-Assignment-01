module.exports = {
  openapi: "3.0.0",
  info: {
    title: "User Service API",
    version: "1.0.0",
    description: "Handles user registration, authentication, and user lookup."
  },
  servers: [{ url: "http://localhost:3001" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/register": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string", enum: ["student", "admin"] }
                }
              }
            }
          }
        },
        responses: { "201": { description: "User registered" } }
      }
    },
    "/login": {
      post: {
        summary: "Login and get JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Login successful" } }
      }
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "User found" }, "404": { description: "Not found" } }
      }
    },
    "/internal/users/{id}": {
      get: {
        summary: "Internal user validation endpoint",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "User validation result" } }
      }
    }
  }
};
