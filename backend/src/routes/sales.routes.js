const express = require("express");
const router = express.Router();

const {
  createSale,
  getSales,
  getSale
} = require("../controllers/sales.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * =====================
 * SALES MODULE
 * =====================
 * Invoice creation and management
 */

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales Invoice Management System
 */

/* =========================================================
   CREATE SALES INVOICE
========================================================= */
/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Create sales invoice
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *             properties:
 *               customer:
 *                 type: string
 *                 example: "65a1234567890abcde123456"
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
 *                       example: "65b1234567890abcde999999"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *               discount:
 *                 type: number
 *                 example: 0
 *               notes:
 *                 type: string
 *                 example: "Delivered successfully"
 *     responses:
 *       201:
 *         description: Sales invoice created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post(
  "/",
  restrictTo("admin", "salesman"),
  createSale
);

/* =========================================================
   GET ALL SALES
========================================================= */
/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales invoices
 *     description: Admin sees all invoices, Salesman sees only assigned
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales invoices
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  restrictTo("admin", "salesman"),
  getSales
);

/* =========================================================
   GET SINGLE SALE
========================================================= */
/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get single sales invoice
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sales invoice ID
 *     responses:
 *       200:
 *         description: Sales invoice details
 *       404:
 *         description: Invoice not found
 *       403:
 *         description: Access denied
 */
router.get(
  "/:id",
  restrictTo("admin", "salesman"),
  getSale
);

module.exports = router;