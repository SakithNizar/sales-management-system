const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ------------------------
// Import & mount routes
// ------------------------
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);

const productionProductRoutes = require("./routes/productionProduct.routes");
app.use("/api/production-products", productionProductRoutes);

const productionBatchRoutes = require("./routes/productionBatch.routes");
app.use("/api/production-batches", productionBatchRoutes);

const reportsRoutes = require("./routes/reports.routes");

// All report routes will now be under /api/reports or /api/dashboard
app.use("/api/reports", reportsRoutes);
// ------------------------
// Swagger Documentation
// ------------------------
const { swaggerUi, specs } = require("./swagger"); 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;
