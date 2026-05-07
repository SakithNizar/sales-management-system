const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const {
  getAdminStats,
  getMonthlySales,
  getRecentActivities
} = require("../controllers/adminDashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin Dashboard Statistics and Analytics
 */

// =====================
// GET ADMIN STATISTICS
// =====================
/**
 * @swagger
 * /admin-dashboard/stats:
 *   get:
 *     summary: "Get admin dashboard statistics"
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns aggregated statistics for admin dashboard:
 *       - totalUsers: Total number of users in system
 *       - activeItems: Number of active items
 *       - yearlyExpenses: Total expenses for current year
 *       - totalProductionBatches: Total production batches created
 *       - totalCustomers: Number of active customers
 *       - totalSalesThisYear: Total sales amount for current year
 *       - totalStockValue: Total value of current stock
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 24
 *                     activeItems:
 *                       type: integer
 *                       example: 156
 *                     yearlyExpenses:
 *                       type: number
 *                       example: 342800
 *                     totalProductionBatches:
 *                       type: integer
 *                       example: 42
 *                     totalCustomers:
 *                       type: integer
 *                       example: 156
 *                     totalSalesThisYear:
 *                       type: number
 *                       example: 1250000
 *                     totalStockValue:
 *                       type: number
 *                       example: 450000
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/stats",
  protect,
  restrictTo("admin"),
  getAdminStats
);

// =====================
// GET MONTHLY SALES DATA
// =====================
/**
 * @swagger
 * /admin-dashboard/monthly-sales:
 *   get:
 *     summary: "Get monthly sales data for chart"
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly sales data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     values:
 *                       type: array
 *                       items:
 *                         type: number
 */
router.get(
  "/monthly-sales",
  protect,
  restrictTo("admin"),
  getMonthlySales
);

// =====================
// GET RECENT ACTIVITIES
// =====================
/**
 * @swagger
 * /admin-dashboard/recent-activities:
 *   get:
 *     summary: "Get recent activities (users, batches, sales)"
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 */
router.get(
  "/recent-activities",
  protect,
  restrictTo("admin"),
  getRecentActivities
);

module.exports = router;