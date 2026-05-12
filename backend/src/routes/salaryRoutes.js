const express = require("express");
const router = express.Router();

const {
  createSalary,
  getAllSalaries,
  getSalaryByStaff,
  updateSalary,
  deleteSalary,
  getMonthlyReport,
  getDashboardSummary
} = require("../controllers/salaryController");

const {
  createAdvance,
  getAllAdvances,
  getAdvancesByStaff
} = require("../controllers/advanceController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

// ===============================
// SALARY ROUTES (ADMIN ONLY)
// ===============================
router.post("/salary", protect, restrictTo("admin"), createSalary);
router.get("/salary", protect, restrictTo("admin"), getAllSalaries);
router.get("/salary/:staffId", protect, restrictTo("admin"), getSalaryByStaff);
router.put("/salary/:id", protect, restrictTo("admin"), updateSalary);
router.delete("/salary/:id", protect, restrictTo("admin"), deleteSalary);

// ===============================
// ADVANCE ROUTES (ADMIN ONLY)
// ===============================
router.post("/advance", protect, restrictTo("admin"), createAdvance);
router.get("/advance", protect, restrictTo("admin"), getAllAdvances);
router.get("/advance/:staffId", protect, restrictTo("admin"), getAdvancesByStaff);

// ===============================
// REPORTS & DASHBOARD
// ===============================
router.get("/report/monthly", protect, restrictTo("admin"), getMonthlyReport);
router.get("/dashboard", protect, restrictTo("admin"), getDashboardSummary);

module.exports = router;