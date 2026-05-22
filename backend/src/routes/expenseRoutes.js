// routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const {
  addExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseTotals,
  getExpensesByCategory,
  getMonthlyExpenseReport
} = require("../controllers/expenseController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

// All routes are protected and only accessible by admin
router.use(protect);
router.use(restrictTo("admin"));

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management APIs for tracking all business expenses
 */

// ===============================
// CREATE EXPENSE
// ===============================
/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Add a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     description: Create a new expense record. Automatically updates the account ledger.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - subject
 *               - invoiceNo
 *               - amount
 *               - paymentMethod
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-14"
 *               category:
 *                 type: string
 *                 enum: [Raw Material, Packaging, Transport, Utility, Maintenance, Labour, Office Expense, Other]
 *                 example: "Raw Material"
 *               subject:
 *                 type: string
 *                 example: "Milk Powder"
 *               invoiceNo:
 *                 type: string
 *                 example: "INV001"
 *               amount:
 *                 type: number
 *                 example: 25000
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Card]
 *                 example: "Cash"
 *     responses:
 *       201:
 *         description: Expense added successfully
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
 *                 expense:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post("/", addExpense);

// ===============================
// GET ALL EXPENSES
// ===============================
/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Get all expenses with optional filters
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by expense category
 *     responses:
 *       200:
 *         description: List of expenses with summary
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
 *                     totalExpenses:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     categoryBreakdown:
 *                       type: object
 *                 expenses:
 *                   type: array
 */
router.get("/", getExpenses);

// ===============================
// GET EXPENSE TOTALS
// ===============================
/**
 * @swagger
 * /expenses/totals:
 *   get:
 *     summary: Get expense totals (daily, monthly, yearly)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     description: Returns aggregated expense totals with category breakdown
 *     responses:
 *       200:
 *         description: Totals calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totals:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: number
 *                     monthly:
 *                       type: number
 *                     yearly:
 *                       type: number
 *                 categoryBreakdown:
 *                   type: array
 */
router.get("/totals", getExpenseTotals);

// ===============================
// GET EXPENSES BY CATEGORY
// ===============================
/**
 * @swagger
 * /expenses/category/{category}:
 *   get:
 *     summary: Get expenses by category
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense category
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
 *     responses:
 *       200:
 *         description: Expenses filtered by category
 *       400:
 *         description: Invalid category
 */
router.get("/category/:category", getExpensesByCategory);

// ===============================
// GET MONTHLY EXPENSE REPORT
// ===============================
/**
 * @swagger
 * /expenses/report/monthly:
 *   get:
 *     summary: Get monthly expense report
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2026)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *     responses:
 *       200:
 *         description: Monthly expense report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                     month:
 *                       type: integer
 *                     totalExpenses:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     categoryBreakdown:
 *                       type: object
 *                 expenses:
 *                   type: array
 *       400:
 *         description: Year and month are required
 */
router.get("/report/monthly", getMonthlyExpenseReport);

// ===============================
// GET SINGLE EXPENSE
// ===============================
/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Get a single expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 expense:
 *                   type: object
 *       404:
 *         description: Expense not found
 */
router.get("/:id", getExpenseById);

// ===============================
// UPDATE EXPENSE
// ===============================
/**
 * @swagger
 * /expenses/{id}:
 *   put:
 *     summary: Update an expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               category:
 *                 type: string
 *                 enum: [Raw Material, Packaging, Transport, Utility, Maintenance, Labour, Office Expense, Other]
 *               subject:
 *                 type: string
 *               invoiceNo:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Bank, Card]
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Expense not found
 */
router.put("/:id", updateExpense);

// ===============================
// DELETE EXPENSE
// ===============================
/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       404:
 *         description: Expense not found
 */
router.delete("/:id", deleteExpense);

module.exports = router;