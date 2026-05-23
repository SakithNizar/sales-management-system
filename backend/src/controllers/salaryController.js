// controllers/salaryController.js
const Salary = require("../models/Salary.model");
const Advance = require("../models/Advance.model");
const User = require("../models/User.model");
const { addTransaction } = require("../services/accountService");

// ===============================
// CREATE SALARY (ADMIN ONLY)
// ===============================
exports.createSalary = async (req, res) => {
  try {
    const { staffId, month, salaryDate, salaryPaid, remarks } = req.body;

    // Validate required fields
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required"
      });
    }

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required"
      });
    }

    if (!salaryPaid || salaryPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid salary amount is required"
      });
    }

    // 1. Check staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff not found" 
      });
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
        success: false,
        message: `Salary already exists for ${staff.fullName} in ${month}`
      });
    }

    // 7. Generate payment number
    const paymentNo = `SAL-${Date.now()}`;

    // 8. Create salary record
    const salary = await Salary.create({
      staffId,
      month,
      salaryDate: salaryDate || new Date(),
      basicSalary,
      advancePaid: totalAdvance,
      salaryPaid,
      totalPaid,
      balance,
      paymentNo,
      remarks: remarks || "",
      createdBy: req.user._id
    });

    // =====================
    // ADD TO ACCOUNT LEDGER
    // =====================
    try {
      await addTransaction({
        date: salaryDate || new Date(),
        invoiceNo: paymentNo,
        description: `Salary payment - ${staff.fullName} for ${month}`,
        income: 0,
        expense: totalPaid,
        sourceModule: "salary",
        sourceId: salary._id,
        enteredBy: req.user._id,
        notes: remarks || `Monthly salary for ${month}`
      });
      console.log(`✅ Salary transaction added to accounts for ${staff.fullName} - LKR ${totalPaid}`);
    } catch (accountErr) {
      console.error("Failed to add salary to account ledger:", accountErr);
      // Don't fail the salary creation if account recording fails
    }

    // Populate staff details for response
    const populatedSalary = await Salary.findById(salary._id)
      .populate("staffId", "fullName username role");

    res.status(201).json({
      success: true,
      message: "Salary created successfully",
      salary: populatedSalary
    });
  } catch (error) {
    console.error("Error in createSalary:", error);
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
    console.error("Error in getAllSalaries:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===============================
// GET SALARY BY STAFF
// ===============================
exports.getSalaryByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required"
      });
    }

    const salaries = await Salary.find({ staffId })
      .populate("staffId", "fullName username role")
      .sort({ salaryDate: -1 });

    res.json({
      success: true,
      salaries
    });
  } catch (error) {
    console.error("Error in getSalaryByStaff:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===============================
// GET SINGLE SALARY
// ===============================
exports.getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findById(id)
      .populate("staffId", "fullName username role")
      .populate("createdBy", "fullName username");

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    res.json({
      success: true,
      salary
    });
  } catch (error) {
    console.error("Error in getSalaryById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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
      return res.status(404).json({ 
        success: false,
        message: "Salary not found" 
      });
    }

    const oldTotalPaid = salary.totalPaid;
    
    // Recalculate
    const totalPaid = salary.advancePaid + salaryPaid;
    const balance = salary.basicSalary - totalPaid;

    const updated = await Salary.findByIdAndUpdate(
      id,
      { salaryPaid, totalPaid, balance, remarks },
      { new: true }
    ).populate("staffId", "fullName username role");

    // =====================
    // UPDATE ACCOUNT LEDGER IF AMOUNT CHANGED
    // =====================
    if (oldTotalPaid !== totalPaid) {
      try {
        const Account = require("../models/Account.model");
        await Account.findOneAndUpdate(
          { sourceModule: "salary", sourceId: salary._id },
          { 
            expense: totalPaid,
            notes: remarks || `Salary updated - ${salary.month}`
          }
        );
        console.log(`✅ Salary account transaction updated: ${salary.paymentNo} - Amount changed from ${oldTotalPaid} to ${totalPaid}`);
      } catch (accountErr) {
        console.error("Failed to update account ledger:", accountErr);
      }
    }

    res.json({
      success: true,
      message: "Salary updated successfully",
      salary: updated
    });
  } catch (error) {
    console.error("Error in updateSalary:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===============================
// DELETE SALARY
// ===============================
exports.deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({ 
        success: false,
        message: "Salary not found" 
      });
    }

    // =====================
    // DELETE FROM ACCOUNT LEDGER
    // =====================
    try {
      const Account = require("../models/Account.model");
      const deleted = await Account.deleteOne({ 
        sourceModule: "salary", 
        sourceId: salary._id 
      });
      if (deleted.deletedCount > 0) {
        console.log(`✅ Salary account transaction deleted: ${salary.paymentNo}`);
      }
    } catch (accountErr) {
      console.error("Failed to delete from account ledger:", accountErr);
    }

    await Salary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Salary deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteSalary:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===============================
// GET SALARY MONTHLY REPORT
// ===============================
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ 
        success: false,
        message: "Month is required" 
      });
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
    console.error("Error in getMonthlyReport:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
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
    console.error("Error in getDashboardSummary:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===============================
// GET SALARY SUMMARY BY YEAR
// ===============================
exports.getYearlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const salaries = await Salary.find({
      month: { $regex: currentYear, $options: "i" }
    }).populate("staffId", "fullName username role");

    const monthlyData = [];
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];

    for (const month of months) {
      const monthStr = `${month} ${currentYear}`;
      const monthSalaries = salaries.filter(s => s.month === monthStr);
      
      monthlyData.push({
        month,
        totalSalary: monthSalaries.reduce((sum, s) => sum + s.salaryPaid, 0),
        totalAdvance: monthSalaries.reduce((sum, s) => sum + s.advancePaid, 0),
        totalPaid: monthSalaries.reduce((sum, s) => sum + s.totalPaid, 0),
        staffCount: monthSalaries.length
      });
    }

    const totalYearlySalary = monthlyData.reduce((sum, m) => sum + m.totalSalary, 0);
    const totalYearlyAdvance = monthlyData.reduce((sum, m) => sum + m.totalAdvance, 0);
    const totalYearlyPaid = monthlyData.reduce((sum, m) => sum + m.totalPaid, 0);

    res.json({
      success: true,
      year: currentYear,
      summary: {
        totalYearlySalary,
        totalYearlyAdvance,
        totalYearlyPaid
      },
      monthlyData
    });
  } catch (error) {
    console.error("Error in getYearlySummary:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};