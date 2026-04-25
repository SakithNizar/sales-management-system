const express = require("express");
const router = express.Router();

const {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
  getFinishedGoods,
  getFinishedGoodsForBilling
} = require("../controllers/item.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item Management API
 */

// =====================
// CREATE ITEM
// =====================
/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create new item
 *     tags: [Items]
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
 *               - category
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *                 example: Vanilla Yogurt Drink
 *               category:
 *                 type: string
 *                 enum: [Raw Material, Finished Good]
 *               unit:
 *                 type: string
 *                 example: Bottle
 *               sellingPrice:
 *                 type: number
 *                 example: 120
 *               shelfLifeDays:
 *                 type: number
 *                 example: 7
 *               minimumLevel:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post("/", protect, restrictTo("admin", "store_manager"), createItem);

// =====================
// GET ALL ITEMS
// =====================
/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all items
 */
router.get(
  "/",
  protect,
  restrictTo("admin", "store_manager", "production_manager"),
  getItems
);

// =====================
// GET FINISHED GOODS (PRODUCTION / STOCK)
// =====================
/**
 * @swagger
 * /items/finished-goods:
 *   get:
 *     summary: Get finished goods (no price) for production/stock
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of finished goods without selling price
 */
router.get(
  "/finished-goods",
  protect,
  restrictTo("admin", "production_manager", "store_manager"),
  getFinishedGoods
);

// =====================
// GET FINISHED GOODS (BILLING)
// =====================
/**
 * @swagger
 * /items/finished-goods/billing:
 *   get:
 *     summary: Get finished goods with selling price for billing
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of finished goods with selling price
 */
router.get(
  "/finished-goods/billing",
  protect,
  restrictTo("admin", "salesman"),
  getFinishedGoodsForBilling
);

// =====================
// GET SINGLE ITEM
// =====================
/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get single item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single item data
 *       404:
 *         description: Item not found
 */
router.get(
  "/:id",
  protect,
  restrictTo("admin", "store_manager"),
  getItem
);

// =====================
// UPDATE ITEM
// =====================
/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Raw Material, Finished Good]
 *               unit:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               shelfLifeDays:
 *                 type: number
 *               minimumLevel:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 */
router.put(
  "/:id",
  protect,
  restrictTo("admin", "store_manager"),
  updateItem
);

// =====================
// DELETE ITEM
// =====================
/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  deleteItem
);

module.exports = router;