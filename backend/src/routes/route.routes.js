const express = require("express");
const router = express.Router();

const {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute
} = require("../controllers/route.controller");

const {
  protect,
  restrictTo
} = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Route management for sales distribution
 */

// =====================
// CREATE ROUTE
// =====================
/**
 * @swagger
 * /routes:
 *   post:
 *     summary: Create a new route (Admin only)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *                 example: Negombo East
 *               city:
 *                 type: string
 *                 example: Negombo
 *     responses:
 *       201:
 *         description: Route created successfully
 *       400:
 *         description: Route already exists or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post("/", protect, restrictTo("admin"), createRoute);

// =====================
// GET ALL ROUTES
// =====================
/**
 * @swagger
 * /routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   example: 5
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       city:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, getRoutes);

// =====================
// UPDATE ROUTE
// =====================
/**
 * @swagger
 * /routes/{id}:
 *   put:
 *     summary: Update a route (Admin only)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Negombo West
 *               city:
 *                 type: string
 *                 example: Negombo
 *     responses:
 *       200:
 *         description: Route updated successfully
 *       404:
 *         description: Route not found
 *       400:
 *         description: Duplicate route exists
 *       403:
 *         description: Forbidden
 */
router.put("/:id", protect, restrictTo("admin"), updateRoute);

// =====================
// DELETE ROUTE
// =====================
/**
 * @swagger
 * /routes/{id}:
 *   delete:
 *     summary: Delete a route (Admin only)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 *       403:
 *         description: Forbidden
 */
router.delete("/:id", protect, restrictTo("admin"), deleteRoute);

module.exports = router;