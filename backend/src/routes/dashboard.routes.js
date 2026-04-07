const express = require("express");
const router = express.Router();

const { getDashboardStock } = require("../controllers/dashboard.controller");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard stock management APIs
 */

/**
 * @swagger
 * /dashboard/stock-summary:
 *   get:
 *     summary: Get stock dashboard summary
 *     description: Returns all items with total stock in, stock out, available balance and stock status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: string
 *                         example: "64f123abc456"
 *                       itemName:
 *                         type: string
 *                         example: "Milk Powder"
 *                       unit:
 *                         type: string
 *                         example: "Kg"
 *                       totalIn:
 *                         type: number
 *                         example: 100
 *                       totalOut:
 *                         type: number
 *                         example: 20
 *                       available:
 *                         type: number
 *                         example: 80
 *                       minimumLevel:
 *                         type: number
 *                         example: 20
 *                       status:
 *                         type: string
 *                         example: "In Stock"
 *       500:
 *         description: Internal server error
 */

// Route with authentication
router.get(
  "/stock-summary",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  getDashboardStock
);

module.exports = router;