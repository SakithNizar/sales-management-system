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
app.use("/api/auth", authRoutes); // All login routes start with /api/auth

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const productStockRoutes = require('./routes/productStockRoutes');
app.use('/api/stocks', productStockRoutes);



module.exports = app;
