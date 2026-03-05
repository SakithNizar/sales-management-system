const express = require("express");
const router = express.Router();

const {
  createProductionProduct,
  getProductionProducts,
  updateProductionProduct,
  deleteProductionProduct
} = require("../controllers/productionProduct.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Production Products
 *   description: CRUD operations for Production Products
 */

/**
 * @swagger
 * /production-products/create:
 *   post:
 *     summary: Create a new production product
 *     tags: [Production Products]
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
 *               - shelfLifeDays
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the product
 *                 example: Vanilla Yogurt Drink
 *               shelfLifeDays:
 *                 type: integer
 *                 description: Shelf life in days
 *                 example: 10
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post(
  "/create",
  protect,
  restrictTo("admin", "production_manager"),
  createProductionProduct
);

/**
 * @swagger
 * /production-products:
 *   get:
 *     summary: Get all production products
 *     tags: [Production Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of production products
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  protect,
  restrictTo("admin", "production_manager"),
  getProductionProducts
);

/**
 * @swagger
 * /production-products/{id}:
 *   put:
 *     summary: Update a production product
 *     tags: [Production Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Strawberry Yogurt Drink
 *               shelfLifeDays:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  protect,
  restrictTo("admin", "production_manager"),
  updateProductionProduct
);

/**
 * @swagger
 * /production-products/{id}:
 *   delete:
 *     summary: Delete a production product
 *     tags: [Production Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "production_manager"),
  deleteProductionProduct
);

module.exports = router;