const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController"); 
const { protect } = require("../middlewares/authMiddleware"); 

// =====================
// Public Routes
// =====================

// 1️⃣ Login route (all users)
router.post("/login", login);

// =====================
// Protected Routes (for testing JWT auth)
// =====================
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "User info retrieved successfully",
    user: req.user, // req.user comes from protect middleware
  });
});

module.exports = router;
