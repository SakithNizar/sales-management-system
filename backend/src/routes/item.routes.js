const express = require("express");
const router = express.Router();

const {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
  getFinishedGoods
} = require("../controllers/item.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item Management API
 */

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
 *                 example: Finished Good
 *               unit:
 *                 type: string
 *                 example: Bottle
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
router.get("/", protect, restrictTo("admin", "store_manager", "production_manager"), getItems);

/**
 * @swagger
 * /items/finished-goods:
 *   get:
 *     summary: Get all finished goods for dropdown
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of finished goods items
 */
router.get(
  "/finished-goods",
  protect,
  restrictTo("admin", "production_manager"),
  getFinishedGoods
);

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
 */
router.get("/:id", protect, restrictTo("admin", "store_manager"), getItem);

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
 *               shelfLifeDays:
 *                 type: number
 *               minimumLevel:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put("/:id", protect, restrictTo("admin", "store_manager"), updateItem);

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
 *         description: Item deleted
 */
router.delete("/:id", protect, restrictTo("admin"), deleteItem);

module.exports = router;