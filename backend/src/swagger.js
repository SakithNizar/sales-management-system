// src/swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// ✅ Require Node’s built-in path module at the top
const path = require("path");  

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description: "API documentation for user CRUD operations",
    },
    servers: [
      { url: "http://localhost:5000/api" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  // ✅ Use path.join to point Swagger to your routes folder
  apis: [path.join(__dirname, "./routes/*.js")],
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };