const express = require("express");
const router = express.Router();

const {
  getDailyReport,
  getMonthlyReport,
  getBatchReport,
  getCostAnalysis,
  getExpiryReport,
  getDashboardSummary,
} = require("../controllers/reports.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /reports/daily:
 *   get:
 *     summary: Get daily production report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily production data including batches, total quantity, and total cost
 */
router.get("/daily", protect, restrictTo("admin", "production_manager"), getDailyReport);

/**
 * @swagger
 * /reports/monthly:
 *   get:
 *     summary: Get monthly production report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly production data including total quantity and cost
 */
router.get("/monthly", protect, restrictTo("admin", "production_manager"), getMonthlyReport);

/**
 * @swagger
 * /reports/batch:
 *   get:
 *     summary: Get report by production batch
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Batch report data including item name, quantity, cost, and status
 */
router.get("/batch", protect, restrictTo("admin", "production_manager"), getBatchReport);

/**
 * @swagger
 * /reports/cost-analysis:
 *   get:
 *     summary: Get production cost analysis per item
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost analysis report showing total quantity and cost per item
 */
router.get("/cost-analysis", protect, restrictTo("admin", "production_manager"), getCostAnalysis);

/**
 * @swagger
 * /reports/expiry:
 *   get:
 *     summary: Get batches expiring soon
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of batches that are expiring within the next 7 days
 */
router.get("/expiry", protect, restrictTo("admin", "production_manager"), getExpiryReport);

/**
 * @swagger
 * /reports/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary for production
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary including today's production, expiring batches, and monthly summary
 */
router.get("/dashboard-summary", protect, restrictTo("admin", "production_manager"), getDashboardSummary);

module.exports = router;