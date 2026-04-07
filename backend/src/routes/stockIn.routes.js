const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const stockInController = require("../controllers/stockIn.controller");

/**
 * @swagger
 * tags:
 *   name: Stock IN
 *   description: Stock IN management (Production & Purchase)
 */

/**
 * @swagger
 * /stock-in:
 *   post:
 *     summary: Create new Stock IN
 *     tags: [Stock IN]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Create a new Stock IN record.
 *       - Invoice number auto-generated.
 *       - Manager auto from logged-in user.
 *       - Production → batch details auto-filled.
 *       - Purchase → unitCost must be provided.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - source
 *               - items
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-30"
 *               source:
 *                 type: string
 *                 enum: [Production, Purchase]
 *                 example: "Production"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item
 *                   properties:
 *                     item:
 *                       type: string
 *                       example: "69c52defc7be50ef3d5fc393"
 *                     batchNo:
 *                       type: string
 *                       example: "BY-1003"
 *                     quantity:
 *                       type: number
 *                       example: 500
 *                     unitCost:
 *                       type: number
 *                       example: 120
 *                     expiryDate:
 *                       type: string
 *                       format: date
 *                       example: "2026-04-05"
 *     responses:
 *       201:
 *         description: Stock IN created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockInController.createStockIn
);

/**
 * @swagger
 * /stock-in:
 *   get:
 *     summary: Get all Stock IN (Formatted for table)
 *     tags: [Stock IN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of formatted Stock IN records
 *         content:
 *           application/json:
 *             example:
 *               - date: "2026-03-30"
 *                 invoiceNo: "ST-IN-002"
 *                 itemName: "Vanilla Yogurt Drink"
 *                 quantity: 500
 *                 unit: "Bottle"
 *                 store: "Production"
 *                 manager: "Admin Name"
 *                 remarks: "BY-1003"
 *                 expiryDate: "2026-04-02"
 *                 stockInId: "69cb65c99b6da8d75bd31162"
 */
router.get(
  "/",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockInController.getStockIns
);

/**
 * @swagger
 * /stock-in/{id}:
 *   get:
 *     summary: Get single Stock IN invoice (Full details)
 *     tags: [Stock IN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Stock IN ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full invoice details
 *       404:
 *         description: Stock IN not found
 */
router.get(
  "/:id",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockInController.getStockInById
);

/**
 * @swagger
 * /stock-in/{id}:
 *   put:
 *     summary: Update Stock IN invoice
 *     tags: [Stock IN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Stock IN ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             date: "2026-03-30"
 *             source: "Purchase"
 *             items:
 *               - item: "69c6d5f32e36e31ac9c7af62"
 *                 quantity: 200
 *                 unitCost: 95
 *                 expiryDate: "2026-06-01"
 *     responses:
 *       200:
 *         description: Stock IN updated successfully
 *       404:
 *         description: Stock IN not found
 */
router.put(
  "/:id",
  protect,
  restrictTo("admin", "store_manager"),
  stockInController.updateStockIn
);

/**
 * @swagger
 * /stock-in/{id}:
 *   delete:
 *     summary: Delete Stock IN invoice
 *     tags: [Stock IN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Stock IN ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock IN deleted successfully
 *       404:
 *         description: Stock IN not found
 */
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  stockInController.deleteStockIn
);

module.exports = router;