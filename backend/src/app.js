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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


const productionBatchRoutes = require("./routes/productionBatch.routes");
app.use("/api/production-batches", productionBatchRoutes);

const reportsRoutes = require("./routes/reports.routes");

// All report routes will now be under /api/reports or /api/dashboard
app.use("/api/reports", reportsRoutes);


const itemRoutes = require("./routes/item.routes"); 
app.use("/api/items", itemRoutes);

// ------------------------
// Stock IN Routes
// ------------------------
const stockInRoutes = require("./routes/stockIn.routes");
app.use("/api/stock-in", stockInRoutes);

const stockOutRoutes = require("./routes/stockOut.routes");

// Use the route
app.use("/api/stock-out", stockOutRoutes);


const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);
// ------------------------
// Swagger Documentation
// ------------------------
const { swaggerUi, specs } = require("./swagger"); 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;
