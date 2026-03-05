const express = require("express");
const cors = require("cors");

const { swaggerUi, specs } = require("./swagger"); //  Add this

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs)); //  Add this

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ------------------------
// Import & mount routes
// ------------------------
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const productStockRoutes = require('./routes/productStockRoutes');
app.use('/api/stocks', productStockRoutes);

module.exports = app;
