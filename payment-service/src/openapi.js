module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Payment Service API",
    version: "1.0.0",
    description: "Handles payment processing for contracts."
  },
  servers: [{ url: "http://localhost:3003" }],
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
    "/payments/pay": {
      post: {
        summary: "Make a payment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contractId", "amount", "userId"],
                properties: {
                  contractId: { type: "string" },
                  amount: { type: "number" },
                  userId: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Payment created" } }
      }
    },
    "/payments": {
      get: {
        summary: "Get payments",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Payment list" } }
      }
    }
  }
};
