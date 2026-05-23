// routes/payment.routes.js
const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  reversePayment,
  getPaymentsByCustomer,
  getPaymentsByInvoice,
  getPaymentSummary
} = require("../controllers/payment.controller");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment Collection (Receipts) Management with Account Integration
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
 *     description: Records a payment against an invoice. Automatically updates invoice payment status, customer balance, and creates account transaction.
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
 *                 description: Customer ID
 *               invoice:
 *                 type: string
 *                 example: "662def123456"
 *                 description: Sales Invoice ID
 *               amount:
 *                 type: number
 *                 example: 2000
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Online, Cheque]
 *                 example: Cash
 *               referenceNo:
 *                 type: string
 *                 example: "TRX-123456"
 *                 description: Reference number for bank/online payments
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *                 description: Payment date (defaults to current date)
 *               notes:
 *                 type: string
 *                 example: "Partial payment collected"
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *       400:
 *         description: Validation error or amount exceeds due
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Customer or invoice not found
 */
router.post("/", protect, restrictTo("admin", "salesman"), createPayment);

// =====================
// GET ALL PAYMENTS
// =====================
/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: Admin sees all payments, Salesman sees only own collections
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [Cash, Bank, Online, Cheque]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: List of payments with summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     methodBreakdown:
 *                       type: object
 *                 payments:
 *                   type: array
 */
router.get("/", protect, restrictTo("admin", "salesman"), getPayments);

// =====================
// GET PAYMENT SUMMARY
// =====================
/**
 * @swagger
 * /payments/summary:
 *   get:
 *     summary: Get payment summary by period
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly, yearly]
 *         description: Summary period
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for monthly/yearly summary
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month for monthly summary (1-12)
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [Cash, Bank, Online, Cheque]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: Payment summary with method breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     averagePayment:
 *                       type: number
 *                 methodBreakdown:
 *                   type: object
 *                 dailyBreakdown:
 *                   type: object
 */
router.get("/summary", protect, restrictTo("admin", "salesman"), getPaymentSummary);

// =====================
// GET PAYMENTS BY CUSTOMER
// =====================
/**
 * @swagger
 * /payments/customer/{customerId}:
 *   get:
 *     summary: Get all payments for a specific customer
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                 payments:
 *                   type: array
 */
router.get("/customer/:customerId", protect, restrictTo("admin", "salesman"), getPaymentsByCustomer);

// =====================
// GET PAYMENTS BY INVOICE
// =====================
/**
 * @swagger
 * /payments/invoice/{invoiceId}:
 *   get:
 *     summary: Get all payments for a specific invoice
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: List of invoice payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                 payments:
 *                   type: array
 */
router.get("/invoice/:invoiceId", protect, restrictTo("admin", "salesman"), getPaymentsByInvoice);

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
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     receiptId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     referenceNo:
 *                       type: string
 *                     paymentDate:
 *                       type: string
 *                     customer:
 *                       type: object
 *                     invoice:
 *                       type: object
 *                     salesman:
 *                       type: object
 *                     notes:
 *                       type: string
 *       404:
 *         description: Payment not found
 */
router.get("/:id", protect, restrictTo("admin", "salesman"), getPayment);

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
 *     description: Admin only - Updates payment and syncs with account ledger. Amount changes will update invoice and customer balance.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
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
 *                 enum: [Cash, Bank, Online, Cheque]
 *               referenceNo:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       400:
 *         description: Validation error or amount would exceed invoice total
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 */
router.put("/:id", protect, restrictTo("admin"), updatePayment);

// =====================
// DELETE PAYMENT (REVERSE)
// =====================
/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Reverse a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only - Reverses a payment instead of hard deleting. Updates invoice payment status, customer balance, and removes account transaction.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment reversed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     receiptId:
 *                       type: string
 *                     isReversed:
 *                       type: boolean
 *                     reversedAt:
 *                       type: string
 *       400:
 *         description: Payment already reversed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 */
router.delete("/:id", protect, restrictTo("admin"), deletePayment);

// =====================
// REVERSE PAYMENT (Alternative endpoint with reason)
// =====================
/**
 * @swagger
 * /payments/{id}/reverse:
 *   post:
 *     summary: Reverse a payment with reason
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only - Reverses a payment with a reason. Updates invoice payment status, customer balance, and removes account transaction.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Payment recorded in error"
 *     responses:
 *       200:
 *         description: Payment reversed successfully
 *       400:
 *         description: Payment already reversed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment not found
 */
router.post("/:id/reverse", protect, restrictTo("admin"), reversePayment);

module.exports = router;