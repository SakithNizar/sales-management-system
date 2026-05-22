// routes/salaryRoutes.js
const express = require("express");
const router = express.Router();

const {
  createSalary,
  getAllSalaries,
  getSalaryByStaff,
  getSalaryById,
  updateSalary,
  deleteSalary,
  getMonthlyReport,
  getDashboardSummary,
  getYearlySummary
} = require("../controllers/salaryController");

const {
  createAdvance,
  getAllAdvances,
  getAdvanceById,
  getAdvancesByStaff,
  getStaffAdvanceTotal,
  updateAdvance,
  deleteAdvance
} = require("../controllers/advanceController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Salary & Advances
 *   description: Salary and Advance payment management for staff
 */

// ===============================
// SALARY ROUTES
// ===============================

/**
 * @swagger
 * /salary/salary:
 *   post:
 *     summary: Create a new salary payment
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - month
 *               - salaryPaid
 *             properties:
 *               staffId:
 *                 type: string
 *                 example: "65a1234567890abcde123456"
 *               month:
 *                 type: string
 *                 example: "January 2025"
 *               salaryDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-31"
 *               salaryPaid:
 *                 type: number
 *                 example: 50000
 *               remarks:
 *                 type: string
 *                 example: "Monthly salary paid"
 *     responses:
 *       201:
 *         description: Salary created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post("/salary", protect, restrictTo("admin"), createSalary);

/**
 * @swagger
 * /salary/salary:
 *   get:
 *     summary: Get all salary payments
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all salary payments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/salary", protect, restrictTo("admin"), getAllSalaries);

/**
 * @swagger
 * /salary/salary/{staffId}:
 *   get:
 *     summary: Get salary payments by staff ID
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Salary records for the staff
 *       404:
 *         description: Staff not found
 */
router.get("/salary/staff/:staffId", protect, restrictTo("admin"), getSalaryByStaff);

/**
 * @swagger
 * /salary/salary/{id}:
 *   get:
 *     summary: Get single salary record by ID
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary record ID
 *     responses:
 *       200:
 *         description: Salary record details
 *       404:
 *         description: Salary not found
 */
router.get("/salary/:id", protect, restrictTo("admin"), getSalaryById);

/**
 * @swagger
 * /salary/salary/{id}:
 *   put:
 *     summary: Update salary payment
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salaryPaid:
 *                 type: number
 *                 example: 55000
 *               remarks:
 *                 type: string
 *                 example: "Salary updated with bonus"
 *     responses:
 *       200:
 *         description: Salary updated successfully
 *       404:
 *         description: Salary not found
 */
router.put("/salary/:id", protect, restrictTo("admin"), updateSalary);

/**
 * @swagger
 * /salary/salary/{id}:
 *   delete:
 *     summary: Delete salary record
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary record ID
 *     responses:
 *       200:
 *         description: Salary deleted successfully
 *       404:
 *         description: Salary not found
 */
router.delete("/salary/:id", protect, restrictTo("admin"), deleteSalary);

// ===============================
// ADVANCE ROUTES
// ===============================

/**
 * @swagger
 * /salary/advance:
 *   post:
 *     summary: Create a new advance payment for staff
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - amount
 *             properties:
 *               staffId:
 *                 type: string
 *                 example: "65a1234567890abcde123456"
 *               amount:
 *                 type: number
 *                 example: 10000
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               notes:
 *                 type: string
 *                 example: "Emergency advance"
 *     responses:
 *       201:
 *         description: Advance created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/advance", protect, restrictTo("admin"), createAdvance);

/**
 * @swagger
 * /salary/advance:
 *   get:
 *     summary: Get all advance payments
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all advance payments
 */
router.get("/advance", protect, restrictTo("admin"), getAllAdvances);

/**
 * @swagger
 * /salary/advance/{id}:
 *   get:
 *     summary: Get single advance by ID
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance record ID
 *     responses:
 *       200:
 *         description: Advance record details
 *       404:
 *         description: Advance not found
 */
router.get("/advance/:id", protect, restrictTo("admin"), getAdvanceById);

/**
 * @swagger
 * /salary/advance/staff/{staffId}:
 *   get:
 *     summary: Get advances by staff ID
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Advance records for the staff
 */
router.get("/advance/staff/:staffId", protect, restrictTo("admin"), getAdvancesByStaff);

/**
 * @swagger
 * /salary/advance/staff/{staffId}/total:
 *   get:
 *     summary: Get total advances for a staff member
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Total advance amount for the staff
 */
router.get("/advance/staff/:staffId/total", protect, restrictTo("admin"), getStaffAdvanceTotal);

/**
 * @swagger
 * /salary/advance/{id}:
 *   put:
 *     summary: Update advance payment
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 15000
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Advance updated successfully
 *       404:
 *         description: Advance not found
 */
router.put("/advance/:id", protect, restrictTo("admin"), updateAdvance);

/**
 * @swagger
 * /salary/advance/{id}:
 *   delete:
 *     summary: Delete advance record
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance record ID
 *     responses:
 *       200:
 *         description: Advance deleted successfully
 *       404:
 *         description: Advance not found
 */
router.delete("/advance/:id", protect, restrictTo("admin"), deleteAdvance);

// ===============================
// REPORTS & DASHBOARD
// ===============================

/**
 * @swagger
 * /salary/dashboard:
 *   get:
 *     summary: Get salary dashboard summary
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     description: Returns current month salary statistics including total salary, advances, paid amount, and pending balance
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     totalSalaryThisMonth:
 *                       type: number
 *                       example: 150000
 *                     totalAdvanceGiven:
 *                       type: number
 *                       example: 25000
 *                     totalPaid:
 *                       type: number
 *                       example: 125000
 *                     pendingBalance:
 *                       type: number
 *                       example: 25000
 */
router.get("/dashboard", protect, restrictTo("admin"), getDashboardSummary);

/**
 * @swagger
 * /salary/report/monthly:
 *   get:
 *     summary: Get monthly salary report
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (e.g., "January 2025")
 *     responses:
 *       200:
 *         description: Monthly report generated successfully
 *       400:
 *         description: Month parameter is required
 */
router.get("/report/monthly", protect, restrictTo("admin"), getMonthlyReport);

/**
 * @swagger
 * /salary/report/yearly:
 *   get:
 *     summary: Get yearly salary summary
 *     tags: [Salary & Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: string
 *         description: Year (e.g., "2025"). Defaults to current year
 *     responses:
 *       200:
 *         description: Yearly summary generated successfully
 */
router.get("/report/yearly", protect, restrictTo("admin"), getYearlySummary);

module.exports = router;