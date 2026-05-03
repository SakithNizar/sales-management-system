// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const {
  createUser,
  getAllUsers,
  getUserByUsername,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignRoutesToSalesman
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

// =====================
// GLOBAL AUTH MIDDLEWARE
// =====================
router.use(protect, restrictTo("admin"));

// =====================
// CREATE USER
// =====================
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: Password123!
 *               phoneNumber:
 *                 type: string
 *                 example: "+94771234567"
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 example: salesman
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation or duplicate error
 */
router.post("/", createUser);

// =====================
// GET ALL USERS
// =====================
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (optional filter by role)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role (admin, salesman, etc.)
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", getAllUsers);

// =====================
// GET USER BY USERNAME
// =====================
/**
 * @swagger
 * /users/{username}:
 *   get:
 *     summary: Get user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get("/:username", getUserByUsername);

// =====================
// UPDATE USER (NO ROUTE LOGIC)
// =====================
/**
 * @swagger
 * /users/{username}:
 *   put:
 *     summary: Update user details (NO route assignment here)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               newUsername:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation or duplicate error
 *       404:
 *         description: User not found
 */
router.put("/:username", updateUser);

// =====================
// ASSIGN ROUTES TO SALESMAN
// =====================
/**
 * @swagger
 * /users/{userId}/assign-routes:
 *   post:
 *     summary: Assign routes to salesman
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeIds
 *             properties:
 *               routeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["661abc123", "661abc456"]
 *     responses:
 *       200:
 *         description: Routes assigned successfully
 *       400:
 *         description: Invalid routes
 *       404:
 *         description: Salesman not found
 */
router.post("/:userId/assign-routes", assignRoutesToSalesman);

// =====================
// ACTIVATE USER
// =====================
/**
 * @swagger
 * /users/{username}/activate:
 *   put:
 *     summary: Activate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:username/activate", activateUser);

// =====================
// DEACTIVATE USER
// =====================
/**
 * @swagger
 * /users/{username}/deactivate:
 *   put:
 *     summary: Deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:username/deactivate", deactivateUser);

// =====================
// DELETE USER
// =====================
/**
 * @swagger
 * /users/{username}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:username", deleteUser);

module.exports = router;