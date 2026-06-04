const express = require("express");
const router = express.Router();

const {
  createUser,
  getAllUsers,
  getUserByUsername,
  getCurrentUserProfile,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignRoutesToSalesman,
  bulkUpdateBasicSalary,
  getAllStaffWithSalary
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

// =====================
// PUBLIC (within auth) ROUTES - No strict role restriction
// =====================

/**
 * @swagger
 * /users/me/profile:
 *   get:
 *     summary: Get current logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get("/me/profile", protect, getCurrentUserProfile);

/**
 * @swagger
 * /users/staff/salaries:
 *   get:
 *     summary: Get all staff with basic salary (for salary dropdown)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff with their basic salaries
 */
router.get("/staff/salaries", protect, restrictTo("admin"), getAllStaffWithSalary);

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     summary: Get user by username (admins only, or own profile)
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get("/:username", protect, getUserByUsername);

// =====================
// ADMIN ONLY ROUTES
// =====================
router.use(protect, restrictTo("admin"));

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
 *                 example: 0771234567
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 example: salesman
 *               basicSalary:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation or duplicate error
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
 *         description: Filter users by role (admin, salesman, etc.)
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /users/bulk-salary:
 *   post:
 *     summary: Bulk update basic salaries for multiple staff
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
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     basicSalary:
 *                       type: number
 *                 example: [
 *                   { "userId": "65a1234567890abcde123456", "basicSalary": 55000 },
 *                   { "userId": "65a1234567890abcde123457", "basicSalary": 60000 }
 *                 ]
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.post("/bulk-salary", bulkUpdateBasicSalary);

/**
 * @swagger
 * /users/{username}:
 *   put:
 *     summary: Update user details (including basic salary)
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
 *               basicSalary:
 *                 type: number
 *                 example: 55000
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation or duplicate error
 *       404:
 *         description: User not found
 */
router.put("/:username", updateUser);

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