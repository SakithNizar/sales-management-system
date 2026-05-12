const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getAllTransactions,
  getFilteredTransactions,
  getMonthlyReport
} = require("../controllers/accountController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

// All account routes require authentication and admin role
router.use(protect, restrictTo("admin"));

// Dashboard
router.get("/dashboard", getDashboardSummary);

// Transactions
router.get("/transactions", getAllTransactions);
router.get("/transactions/filter", getFilteredTransactions);

// Reports
router.get("/report/monthly", getMonthlyReport);

module.exports = router;