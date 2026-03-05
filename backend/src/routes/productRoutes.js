const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const { addProduct, updateProduct } = require('../controllers/productController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management APIs
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
 *     description: Create a new product (Protected Route)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - category
 *               - price
 *             properties:
 *               productName:
 *                 type: string
 *                 example: iPhone 15
 *               category:
 *                 type: string
 *                 example: Electronics
 *               price:
 *                 type: number
 *                 example: 1200
 *               description:
 *                 type: string
 *                 example: Latest Apple smartphone
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Validation error or product already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', protect, addProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: Update product details by ID (Protected Route)
 *     tags: [Products]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateProduct);

module.exports = router;