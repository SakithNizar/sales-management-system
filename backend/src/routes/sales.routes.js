// routes/sales.routes.js
const express = require("express");
const router = express.Router();

const {
  createSale,
  getSales,
  getSalesPopupList,
  getSale,
  updateSale,
  addPaymentToSale,
  deleteSale,
  getSalesSummary
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
 *   description: Sales Invoice Management System with Account Integration
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
 *     description: Creates a new sales invoice. Automatically updates customer balance and creates account transaction.
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
 *                 description: Customer ID
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
 *                       description: Item ID
 *                     quantity:
 *                       type: number
 *                       example: 2
 *               discount:
 *                 type: number
 *                 example: 0
 *                 description: Discount amount in LKR
 *               notes:
 *                 type: string
 *                 example: "Delivered successfully"
 *     responses:
 *       201:
 *         description: Sales invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 sale:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Customer or item not found
 */
router.post("/", restrictTo("admin", "salesman"), createSale);

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
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by invoice status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [Unpaid, Partial, Paid]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: List of sales invoices with summary
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
 *                     totalSales:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     totalPaid:
 *                       type: number
 *                     totalDue:
 *                       type: number
 *                 sales:
 *                   type: array
 *       401:
 *         description: Unauthorized
 */
router.get("/", restrictTo("admin", "salesman"), getSales);

/* =========================================================
   GET SALES SUMMARY
========================================================= */
/**
 * @swagger
 * /sales/summary:
 *   get:
 *     summary: Get sales summary by period
 *     tags: [Sales]
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
 *     responses:
 *       200:
 *         description: Sales summary with customer breakdown
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
 *                     totalInvoices:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     totalPaid:
 *                       type: number
 *                     totalDue:
 *                       type: number
 *                     averageInvoiceValue:
 *                       type: number
 *                 customerBreakdown:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/summary", restrictTo("admin", "salesman"), getSalesSummary);

/* =========================================================
   GET SALES INVOICE POPUP LIST
========================================================= */
/**
 * @swagger
 * /sales/popup/list:
 *   get:
 *     summary: Get sales invoice popup list for dropdowns
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns lightweight sales invoice list for dropdowns/popups.
 *       
 *       - Admin → Can see all invoices
 *       - Salesman → Can only see own invoices
 *     responses:
 *       200:
 *         description: Sales popup list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sales:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       invoiceId:
 *                         type: string
 *                       invoiceDate:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       paidAmount:
 *                         type: number
 *                       dueAmount:
 *                         type: number
 *                       paymentStatus:
 *                         type: string
 *                       displayName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get("/popup/list", restrictTo("admin", "salesman"), getSalesPopupList);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sale:
 *                   type: object
 *                   properties:
 *                     invoiceId:
 *                       type: string
 *                     invoiceDate:
 *                       type: string
 *                     customer:
 *                       type: object
 *                     items:
 *                       type: array
 *                     subTotal:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     paidAmount:
 *                       type: number
 *                     dueAmount:
 *                       type: number
 *                     paymentStatus:
 *                       type: string
 *       404:
 *         description: Invoice not found
 *       403:
 *         description: Access denied
 */
router.get("/:id", restrictTo("admin", "salesman"), getSale);

/* =========================================================
   UPDATE SALE
========================================================= */
/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Update sales invoice (payment, status, notes)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paidAmount:
 *                 type: number
 *                 example: 5000
 *                 description: Additional payment amount
 *               status:
 *                 type: string
 *                 enum: [Completed, Pending, Cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale updated successfully
 *       400:
 *         description: Validation error or payment exceeds due amount
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sale not found
 */
router.put("/:id", restrictTo("admin", "salesman"), updateSale);

/* =========================================================
   ADD PAYMENT TO SALE
========================================================= */
/**
 * @swagger
 * /sales/{id}/payment:
 *   post:
 *     summary: Add a payment to a sales invoice
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Records a payment against a sales invoice. Updates:
 *       - Invoice paid amount and due amount
 *       - Payment status (Unpaid/Partial/Paid)
 *       - Customer balance
 *       - Creates payment receipt
 *       - Records transaction in accounts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sales invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Online]
 *                 example: Cash
 *               notes:
 *                 type: string
 *                 example: "Partial payment collected"
 *     responses:
 *       200:
 *         description: Payment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sale:
 *                   type: object
 *                   properties:
 *                     paidAmount:
 *                       type: number
 *                     dueAmount:
 *                       type: number
 *                     paymentStatus:
 *                       type: string
 *                 payment:
 *                   type: object
 *       400:
 *         description: Validation error or payment exceeds due amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sale not found
 */
router.post("/:id/payment", restrictTo("admin", "salesman"), addPaymentToSale);

/* =========================================================
   DELETE SALE
========================================================= */
/**
 * @swagger
 * /sales/{id}:
 *   delete:
 *     summary: Delete sales invoice
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes the invoice and reverses customer balance and account transaction.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sales invoice ID
 *     responses:
 *       200:
 *         description: Sale deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sale not found
 */
router.delete("/:id", restrictTo("admin"), deleteSale);

module.exports = router;