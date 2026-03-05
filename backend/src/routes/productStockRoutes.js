const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

const { 
  addStockBatch, 
  updateStockBatch, 
  getStockSummaryByProduct 
} = require('../controllers/productStockController');

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: Product stock and batch management APIs
 */

/**
 * @swagger
 * /api/stocks/add:
 *   post:
 *     summary: Add a new stock batch
 *     description: Create a new stock batch for a specific product (Protected Route)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - batchNumber
 *               - quantity
 *               - expiryDate
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 65f123abc456789012345678
 *               batchNumber:
 *                 type: string
 *                 example: BATCH-001
 *               quantity:
 *                 type: number
 *                 example: 100
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-31
 *               supplierName:
 *                 type: string
 *                 example: ABC Suppliers
 *     responses:
 *       201:
 *         description: Stock batch added successfully
 *       400:
 *         description: Validation error or batch already exists
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/add', protect, addStockBatch);

/**
 * @swagger
 * /api/stocks/{id}:
 *   put:
 *     summary: Update an existing stock batch
 *     description: Update stock batch details by stock ID (Protected Route)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Stock batch ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               supplierName:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: Stock batch updated successfully
 *       404:
 *         description: Stock batch not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateStockBatch);

/**
 * @swagger
 * /api/stocks/summary/{productId}:
 *   get:
 *     summary: Get stock summary for a product
 *     description: Returns total, expired, near-expiry, and available stock for a product (Protected Route)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock summary retrieved successfully
 *       404:
 *         description: No stock records found for this product
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary/:productId', protect, getStockSummaryByProduct);

module.exports = router;