const express = require("express");
const router = express.Router();
const {
  addProductionBatch,
  getProductionBatches,
  updateProductionBatch,
  deleteProductionBatch
} = require("../controllers/productionBatch.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Production Batches
 *   description: Manage production batches
 */

/**
 * @swagger
 * /production-batches:
 *   post:
 *     summary: Add a new production batch
 *     tags: [Production Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - productId
 *               - quantity
 *               - unitCost
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-15
 *               productId:
 *                 type: string
 *                 description: Product ID from Production Products
 *               quantity:
 *                 type: number
 *               unitCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Batch created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.post("/", protect, restrictTo("admin", "production_manager"), addProductionBatch);

/**
 * @swagger
 * /production-batches:
 *   get:
 *     summary: Get all production batches
 *     tags: [Production Batches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of production batches
 */
router.get("/", protect, restrictTo("admin", "production_manager"), getProductionBatches);

/**
 * @swagger
 * /production-batches/{id}:
 *   put:
 *     summary: Update a production batch
 *     tags: [Production Batches]
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
 *               date:
 *                 type: string
 *                 format: date
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitCost:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Produced, Packed, Dispatched]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch updated successfully
 */
router.put("/:id", protect, restrictTo("admin", "production_manager"), updateProductionBatch);

/**
 * @swagger
 * /production-batches/{id}:
 *   delete:
 *     summary: Delete a production batch
 *     tags: [Production Batches]
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
 *         description: Batch deleted successfully
 */
router.delete("/:id", protect, restrictTo("admin", "production_manager"), deleteProductionBatch);

module.exports = router;