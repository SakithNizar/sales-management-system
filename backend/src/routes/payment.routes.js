const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment
} = require("../controllers/payment.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment Collection (Receipts) Management
 */

// =====================
// CREATE PAYMENT
// =====================
/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Record a new payment receipt
 *     tags: [Payments]
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
 *               - invoice
 *               - amount
 *             properties:
 *               customer:
 *                 type: string
 *                 example: "661abc123456"
 *               invoice:
 *                 type: string
 *                 example: "662def123456"
 *               amount:
 *                 type: number
 *                 example: 2000
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Online]
 *                 example: Cash
 *               notes:
 *                 type: string
 *                 example: Partial payment collected
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
router.post(
  "/",
  protect,
  restrictTo("admin", "salesman"),
  createPayment
);

// =====================
// GET ALL PAYMENTS
// =====================
/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get payment history (Admin all, Salesman own only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: invoice
 *         schema:
 *           type: string
 *         description: Filter by invoice ID
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get(
  "/",
  protect,
  restrictTo("admin", "salesman"),
  getPayments
);

// =====================
// GET SINGLE PAYMENT
// =====================
/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a single payment by ID
 *     tags: [Payments]
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
 *         description: Payment details
 */
router.get(
  "/:id",
  protect,
  restrictTo("admin", "salesman"),
  getPayment
);

// =====================
// UPDATE PAYMENT
// =====================
/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update payment (amount, method, notes)
 *     tags: [Payments]
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
 *               amount:
 *                 type: number
 *                 example: 1500
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Online]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  updatePayment
);

// =====================
// DELETE PAYMENT
// =====================
/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete payment and reverse effect
 *     tags: [Payments]
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
 *         description: Payment deleted successfully
 */
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  deletePayment
);

module.exports = router;