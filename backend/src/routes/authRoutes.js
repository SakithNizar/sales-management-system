// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const { login, logout } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware"); 

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user session management
 */

// =====================
// PUBLIC ROUTES
// =====================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and generate JWT token
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
 *                 example: admin1
 *               password:
 *                 type: string
 *                 example: Admin1234
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login);

// =====================
// PROTECTED ROUTES
// =====================

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "User profile retrieved successfully",
    user: req.user,
  });
});

// =====================
// OPTIONAL: ADMIN TEST ROUTE (for ERP control)
// =====================

/**
 * @swagger
 * /auth/admin-only:
 *   get:
 *     summary: Test route for admin access only
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Forbidden
 */
router.get("/admin-only", protect, restrictTo("admin"), (req, res) => {
  res.status(200).json({
    message: "Admin access granted",
    user: req.user,
  });
});

router.post("/logout", protect, logout);


module.exports = router;