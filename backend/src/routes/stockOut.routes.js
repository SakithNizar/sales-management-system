const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const stockOutController = require("../controllers/stockOut.controller");

/**
 * @swagger
 * /stock-out:
 *   post:
 *     summary: Create new Stock OUT (Finished Good or Raw Material)
 *     tags: [Stock OUT]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Create a new Stock OUT record.
 *       - Manager name is automatically taken from the logged-in user.
 *       - Invoice number is auto-generated.
 *       - Finished Goods are deducted from batches (FIFO).
 *       - Raw Materials are deducted from total quantity without batch.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - items
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-31"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item
 *                     - quantity
 *                   properties:
 *                     item:
 *                       type: string
 *                       example: "69c52defc7be50ef3d5fc393"
 *                     quantity:
 *                       type: number
 *                       example: 50
 *     responses:
 *       201:
 *         description: Stock OUT recorded successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role restricted)
 */
router.post(
  "/",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockOutController.createStockOut
);

/**
 * @swagger
 * /stock-out:
 *   get:
 *     summary: Get all Stock OUT records (formatted table)
 *     tags: [Stock OUT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Stock OUT records (table format)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockOutController.getStockOuts
);

/**
 * @swagger
 * /stock-out/{id}:
 *   get:
 *     summary: Get single Stock OUT invoice details
 *     tags: [Stock OUT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Stock OUT invoice ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full Stock OUT invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  stockOutController.getStockOutById
);

/**
 * @swagger
 * /stock-out/{id}:
 *   put:
 *     summary: Update a Stock OUT record
 *     tags: [Stock OUT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Stock OUT invoice ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Stock OUT updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Stock OUT not found
 */
router.put(
  "/:id",
  protect,
  restrictTo("admin", "store_manager"),
  stockOutController.updateStockOut
);

/**
 * @swagger
 * /stock-out/{id}:
 *   delete:
 *     summary: Delete a Stock OUT record
 *     tags: [Stock OUT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Stock OUT invoice ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock OUT deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Stock OUT not found
 */
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  stockOutController.deleteStockOut
);

module.exports = router;