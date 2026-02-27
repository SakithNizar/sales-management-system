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
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

// All routes are protected and admin-only
router.use(protect, restrictTo("admin"));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
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
 *                 example: admin
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error / duplicate
 */
router.post("/", createUser);

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
 *         description: Optional role filter (e.g., salesman)
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     summary: Get a single user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get("/:username", getUserByUsername);

/**
 * @swagger
 * /users/{username}:
 *   put:
 *     summary: Update a user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to update
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
 *         description: Validation error / duplicate
 *       404:
 *         description: User not found
 */
router.put("/:username", updateUser);

/**
 * @swagger
 * /users/{username}/activate:
 *   put:
 *     summary: Activate a user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to activate
 *     responses:
 *       200:
 *         description: User activated successfully
 *       404:
 *         description: User not found
 */
router.put("/:username/activate", activateUser);

/**
 * @swagger
 * /users/{username}/deactivate:
 *   put:
 *     summary: Deactivate a user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to deactivate
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.put("/:username/deactivate", deactivateUser);

/**
 * @swagger
 * /users/{username}:
 *   delete:
 *     summary: Delete a user by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/:username", deleteUser);

module.exports = router;