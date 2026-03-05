const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Management System API",
      version: "1.0.0",
      description: "API documentation for Sales Management Backend",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
    securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
},

  },
  apis: ["./src/routes/*.js"], // This scans your route files
// apis: ["./routes/authRoutes.js"],

};

const specs = swaggerJsDoc(options);
// console.log(specs.paths);


module.exports = { swaggerUi, specs };
