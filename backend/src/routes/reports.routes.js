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
 * /reports/monthly:
 *   get:
 *     summary: Get monthly production report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly production data
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
 *         description: Batch report data
 */
router.get("/batch", protect, restrictTo("admin", "production_manager"), getBatchReport);

/**
 * @swagger
 * /reports/cost-analysis:
 *   get:
 *     summary: Get production cost analysis per product
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost analysis data
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
 *         description: Expiry report data
 */
router.get("/expiry", protect, restrictTo("admin", "production_manager"), getExpiryReport);

/**
 * @swagger
 * /reports/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
router.get("/dashboard-summary", protect, restrictTo("admin", "production_manager"), getDashboardSummary);

module.exports = router;