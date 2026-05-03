const Salary = require("../models/Salary.model");
const Advance = require("../models/Advance.model");
const User = require("../models/User.model");

// ===============================
// CREATE SALARY (ADMIN ONLY)
// ===============================
exports.createSalary = async (req, res) => {
  try {
    const { staffId, month, salaryDate, salaryPaid, remarks } = req.body;

    // 1. Check staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // 2. Get basic salary (add this field to User model if not exists)
    const basicSalary = staff.basicSalary || 0;

    // 3. Get all advances for this staff
    const advances = await Advance.find({ staffId });

    // 4. Calculate total advance
    const totalAdvance = advances.reduce((sum, item) => sum + item.amount, 0);

    // 5. Calculations
    const totalPaid = totalAdvance + salaryPaid;
    const balance = basicSalary - totalPaid;

    // 6. Check for duplicate (same staff + same month)
    const existingSalary = await Salary.findOne({ staffId, month });
    if (existingSalary) {
      return res.status(400).json({
        message: `Salary already exists for ${staff.fullName} in ${month}`
      });
    }

    // 7. Generate payment number
    const paymentNo = "SAL-" + Date.now();

    // 8. Create salary record
    const salary = await Salary.create({
      staffId,
      month,
      salaryDate,
      basicSalary,
      advancePaid: totalAdvance,
      salaryPaid,
      totalPaid,
      balance,
      paymentNo,
      remarks,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Salary created successfully",
      salary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET ALL SALARIES
// ===============================
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find()
      .populate("staffId", "fullName username role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      salaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET SALARY BY STAFF
// ===============================
exports.getSalaryByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const salaries = await Salary.find({ staffId })
      .populate("staffId", "fullName username role")
      .sort({ salaryDate: -1 });

    res.json({
      success: true,
      salaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// UPDATE SALARY
// ===============================
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salaryPaid, remarks } = req.body;

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }

    // Recalculate
    const totalPaid = salary.advancePaid + salaryPaid;
    const balance = salary.basicSalary - totalPaid;

    const updated = await Salary.findByIdAndUpdate(
      id,
      { salaryPaid, totalPaid, balance, remarks },
      { new: true }
    );

    res.json({
      success: true,
      message: "Salary updated successfully",
      salary: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// DELETE SALARY
// ===============================
exports.deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    await Salary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Salary deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// MONTHLY REPORT
// ===============================
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const salaries = await Salary.find({ month })
      .populate("staffId", "fullName username role");

    const totalStaff = salaries.length;
    const totalSalary = salaries.reduce((sum, s) => sum + s.salaryPaid, 0);
    const totalAdvance = salaries.reduce((sum, s) => sum + s.advancePaid, 0);
    const totalPaid = salaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalBalance = salaries.reduce((sum, s) => sum + s.balance, 0);

    res.json({
      success: true,
      report: {
        month,
        totalStaff,
        totalSalary,
        totalAdvance,
        totalPaid,
        totalBalance
      },
      details: salaries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// DASHBOARD SUMMARY
// ===============================
exports.getDashboardSummary = async (req, res) => {
  try {
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    const currentMonthSalaries = await Salary.find({ month: currentMonth });

    const totalSalaryThisMonth = currentMonthSalaries.reduce(
      (sum, s) => sum + s.salaryPaid,
      0
    );
    const totalAdvanceGiven = currentMonthSalaries.reduce(
      (sum, s) => sum + s.advancePaid,
      0
    );
    const totalPaid = currentMonthSalaries.reduce(
      (sum, s) => sum + s.totalPaid,
      0
    );
    const pendingBalance = currentMonthSalaries.reduce(
      (sum, s) => sum + s.balance,
      0
    );

    res.json({
      success: true,
      dashboard: {
        totalSalaryThisMonth,
        totalAdvanceGiven,
        totalPaid,
        pendingBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};