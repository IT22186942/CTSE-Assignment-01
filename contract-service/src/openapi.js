module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Contract Service API",
    version: "1.0.0",
    description: "Handles contract applications, approvals, and listing."
  },
  servers: [{ url: "http://localhost:3002" }],
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
    "/contracts/apply": {
      post: {
        summary: "Apply for a contract",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "title", "details"],
                properties: {
                  userId: { type: "string" },
                  title: { type: "string" },
                  details: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Contract applied" } }
      }
    },
    "/contracts": {
      get: {
        summary: "List contracts",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Contract list" } }
      }
    },
    "/contracts/{id}/approve": {
      put: {
        summary: "Approve contract (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Contract approved" } }
      }
    },
    "/internal/contracts/{id}": {
      get: {
        summary: "Internal contract validation endpoint",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Contract details" } }
      }
    }
  }
};
