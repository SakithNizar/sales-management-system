// routes/accountRoutes.js
const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getAllTransactions,
  getFilteredTransactions,
  getTransactionById,
  deleteTransaction,
  getMonthlyReport,
  getYearlyReport
} = require("../controllers/accountController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

// All account routes require authentication and admin role
router.use(protect, restrictTo("admin"));

// Dashboard
router.get("/dashboard", getDashboardSummary);

// Transactions
router.get("/transactions", getAllTransactions);
router.get("/transactions/filter", getFilteredTransactions);
router.get("/transactions/:id", getTransactionById);
router.delete("/transactions/:id", deleteTransaction);

// Reports
router.get("/report/monthly", getMonthlyReport);
router.get("/report/yearly", getYearlyReport);

module.exports = router;