module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Notification Service API",
    version: "1.0.0",
    description: "Stores and exposes notifications."
  },
  servers: [{ url: "http://localhost:3004" }],
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
    "/notify": {
      post: {
        summary: "Create a new notification (internal)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "message", "type"],
                properties: {
                  userId: { type: "string" },
                  message: { type: "string" },
                  type: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Notification created" } }
      }
    },
    "/notifications": {
      get: {
        summary: "Get notifications (optionally by userId)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "userId", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Notifications list" } }
      }
    }
  }
};
