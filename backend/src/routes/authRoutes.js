// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController"); 
const { protect } = require("../middlewares/authMiddleware"); 

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes (login, JWT test)
 */

// =====================
// Public Routes
// =====================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login);

// =====================
// Protected Routes (for testing JWT auth)
// =====================

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User info retrieved successfully
 *                 user:
 *                   type: object
 *                   example: { "id": "64f123abc", "username": "johndoe", "role": "admin" }
 *       401:
 *         description: Unauthorized (invalid or missing token)
 */
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "User info retrieved successfully",
    user: req.user,
  });
});

module.exports = router;