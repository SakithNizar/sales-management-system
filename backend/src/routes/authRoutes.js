const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization APIs
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login Admin or Salesman
 *     description: Authenticate user and return JWT token if credentials are valid.
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
 *                 example: admin01
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Username and password are required
 *       401:
 *         description: Invalid username or password
 *       403:
 *         description: Account is inactive
 *       500:
 *         description: Server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged-in user information
 *     description: Returns user details of the authenticated user. Requires Bearer token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *       401:
 *         description: Not authorized or token failed
 */
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "User info retrieved successfully",
    user: req.user,
  });
});

module.exports = router;
