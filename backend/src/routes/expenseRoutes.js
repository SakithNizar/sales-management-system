const express = require("express");
const router = express.Router();
const {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseTotals,
} = require("../controllers/expenseController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

// All routes are protected and only accessible by admin
router.use(protect);
router.use(restrictTo("admin"));

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management APIs
 */

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Add a new expense
 *     tags: [Expenses]
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
 *                 example: "Cash"
 *     responses:
 *       201:
 *         description: Expense added successfully
 *       400:
 *         description: Validation error
 */
router.post("/", addExpense);

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
 *         description: Filter start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter end date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get("/", getExpenses);

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
 *               subject:
 *                 type: string
 *               invoiceNo:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense updated successfully
 */
router.put("/:id", updateExpense);

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
 */
router.delete("/:id", deleteExpense);

/**
 * @swagger
 * /expenses/totals:
 *   get:
 *     summary: Get expense totals (daily, monthly, yearly)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totals calculated successfully
 */
router.get("/totals", getExpenseTotals);

module.exports = router;