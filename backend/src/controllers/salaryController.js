// controllers/salaryController.js
const Salary = require("../models/Salary.model");
const Advance = require("../models/Advance.model");
const User = require("../models/User.model");
const { addTransaction, updateTransaction } = require("../services/accountService");

// ===============================
// CREATE SALARY (ADMIN ONLY)
// ===============================
exports.createSalary = async (req, res) => {
  try {
    const { staffId, month, salaryDate, salaryPaid, remarks } = req.body;

    console.log("Creating salary with:", { staffId, month, salaryDate, salaryPaid });

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

    // 1. Check staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff not found" 
      });
    }

    // 2. Get basic salary from User model
    const basicSalary = staff.basicSalary || 0;
    
    if (basicSalary === 0) {
      return res.status(400).json({
        success: false,
        message: `Staff ${staff.fullName} does not have a basic salary set. Please update their profile first.`
      });
    }

    // 3. Get all advances for this staff for the current month only
    const advances = await Advance.find({ 
      staffId,
      month: month
    });
    
    const totalAdvance = advances.reduce((sum, item) => sum + item.amount, 0);
    console.log(`Found ${advances.length} advances for ${staff.fullName} in ${month}, total: ${totalAdvance}`);

    // 4. Calculate amounts correctly
    let finalSalaryPaid;
    let totalPaid;
    let balance;

    if (salaryPaid && salaryPaid > 0) {
      // If admin manually enters salary paid amount
      finalSalaryPaid = salaryPaid;
      totalPaid = totalAdvance + finalSalaryPaid;
      balance = basicSalary - totalPaid;
    } else {
      // Auto-calculate: Salary paid = Basic salary - advances taken
      finalSalaryPaid = Math.max(0, basicSalary - totalAdvance);
      totalPaid = basicSalary;
      balance = 0;
    }

    // Ensure balance is not negative
    balance = Math.max(0, balance);

    // 5. Check for duplicate (same staff + same month)
    const existingSalary = await Salary.findOne({ staffId, month });
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: `Salary already exists for ${staff.fullName} in ${month}`
      });
    }

    // 6. Generate payment number
    const paymentNo = `SAL-${Date.now()}`;

    // 7. Create salary record
    const salary = await Salary.create({
      staffId,
      month,
      salaryDate: salaryDate || new Date(),
      basicSalary,
      advancePaid: totalAdvance,
      salaryPaid: finalSalaryPaid,
      totalPaid,
      balance,
      paymentNo,
      remarks: remarks || "",
      createdBy: req.user._id
    });

    console.log(`✅ Salary created for ${staff.fullName} - Basic: ${basicSalary}, Advance: ${totalAdvance}, Paid: ${finalSalaryPaid}, Total: ${totalPaid}`);

    // =====================
    // ADD TO ACCOUNT LEDGER - RECORD ONLY THE ACTUAL SALARY PAID
    // =====================
    try {
      await addTransaction({
        date: salaryDate || new Date(),
        invoiceNo: paymentNo,
        description: `Salary payment - ${staff.fullName} for ${month}`,
        income: 0,
        expense: finalSalaryPaid,
        sourceModule: "salary",
        sourceId: salary._id,
        enteredBy: req.user._id,
        notes: remarks || `Monthly salary for ${month} (Advance deducted: ${totalAdvance})`
      });
      console.log(`✅ Salary transaction added to accounts for ${staff.fullName} - LKR ${finalSalaryPaid} (Cash paid, Advance: ${totalAdvance})`);
    } catch (accountErr) {
      console.error("Failed to add salary to account ledger:", accountErr);
    }

    // Populate staff details for response
    const populatedSalary = await Salary.findById(salary._id)
      .populate("staffId", "fullName username role basicSalary");

    res.status(201).json({
      success: true,
      message: "Salary created successfully",
      salary: populatedSalary,
      summary: {
        basicSalary,
        totalAdvance,
        salaryPaid: finalSalaryPaid,
        totalPaid,
        balance
      }
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
      .populate("staffId", "fullName username role basicSalary")
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
      .populate("staffId", "fullName username role basicSalary")
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
      .populate("staffId", "fullName username role basicSalary")
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
// UPDATE SALARY - FIXED WITH PROPER ACCOUNT UPDATE
// ===============================
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salaryPaid, remarks } = req.body;

    console.log("Updating salary with:", { id, salaryPaid, remarks });

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({ 
        success: false,
        message: "Salary not found" 
      });
    }

    const oldSalaryPaid = salary.salaryPaid;
    const oldTotalPaid = salary.totalPaid;
    
    // Recalculate with new salaryPaid
    const newTotalPaid = salary.advancePaid + salaryPaid;
    const newBalance = Math.max(0, salary.basicSalary - newTotalPaid);

    console.log(`Updating: Old Paid: ${oldSalaryPaid}, New Paid: ${salaryPaid}, Old Total: ${oldTotalPaid}, New Total: ${newTotalPaid}`);

    const updated = await Salary.findByIdAndUpdate(
      id,
      { 
        salaryPaid: salaryPaid, 
        totalPaid: newTotalPaid, 
        balance: newBalance, 
        remarks: remarks || salary.remarks 
      },
      { new: true }
    ).populate("staffId", "fullName username role basicSalary");

    // =====================
    // UPDATE ACCOUNT LEDGER USING THE SERVICE FUNCTION
    // =====================
    if (oldSalaryPaid !== salaryPaid) {
      try {
        const Account = require("../models/Account.model");
        const accountTransaction = await Account.findOne({ 
          sourceModule: "salary", 
          sourceId: salary._id 
        });
        
        if (accountTransaction) {
          // Use updateTransaction service to properly update balance
          await updateTransaction(accountTransaction._id, {
            expense: salaryPaid,
            notes: remarks || `Salary updated - ${salary.month} (Advance: ${salary.advancePaid})`,
            description: `Salary payment updated - ${updated.staffId?.fullName} for ${salary.month}`
          });
          console.log(`✅ Salary account transaction updated via service: ${salary.paymentNo} - Amount changed from ${oldSalaryPaid} to ${salaryPaid}`);
        } else {
          // If no account record exists, create one
          console.log(`No account record found for salary ${salary.paymentNo}, creating new one`);
          await addTransaction({
            date: salary.salaryDate,
            invoiceNo: salary.paymentNo,
            description: `Salary payment - ${updated.staffId?.fullName} for ${salary.month}`,
            income: 0,
            expense: salaryPaid,
            sourceModule: "salary",
            sourceId: salary._id,
            enteredBy: req.user._id,
            notes: remarks || `Monthly salary for ${salary.month} (Advance deducted: ${salary.advancePaid})`
          });
          console.log(`✅ New salary account transaction created: ${salary.paymentNo}`);
        }
      } catch (accountErr) {
        console.error("Failed to update account ledger:", accountErr);
      }
    } else {
      console.log("Salary amount unchanged, skipping account update");
    }

    // Populate staff details for response
    const populatedSalary = await Salary.findById(updated._id)
      .populate("staffId", "fullName username role basicSalary");

    res.json({
      success: true,
      message: "Salary updated successfully",
      salary: populatedSalary,
      changes: {
        oldSalaryPaid,
        newSalaryPaid: salaryPaid,
        oldTotalPaid,
        newTotalPaid,
        oldBalance: salary.balance,
        newBalance
      }
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

    console.log(`Deleting salary: ${salary.paymentNo} - Amount: ${salary.salaryPaid}`);

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
      } else {
        console.log(`No account transaction found for salary: ${salary.paymentNo}`);
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
      .populate("staffId", "fullName username role basicSalary");

    const totalStaff = salaries.length;
    const totalBasicSalary = salaries.reduce((sum, s) => sum + s.basicSalary, 0);
    const totalSalary = salaries.reduce((sum, s) => sum + s.salaryPaid, 0);
    const totalAdvance = salaries.reduce((sum, s) => sum + s.advancePaid, 0);
    const totalPaid = salaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalBalance = salaries.reduce((sum, s) => sum + s.balance, 0);

    res.json({
      success: true,
      report: {
        month,
        totalStaff,
        totalBasicSalary,
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

    const totalBasicSalary = currentMonthSalaries.reduce(
      (sum, s) => sum + s.basicSalary,
      0
    );
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
        totalBasicSalary,
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
    }).populate("staffId", "fullName username role basicSalary");

    const monthlyData = [];
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];

    for (const month of months) {
      const monthStr = `${month} ${currentYear}`;
      const monthSalaries = salaries.filter(s => s.month === monthStr);
      
      monthlyData.push({
        month,
        totalBasicSalary: monthSalaries.reduce((sum, s) => sum + s.basicSalary, 0),
        totalSalary: monthSalaries.reduce((sum, s) => sum + s.salaryPaid, 0),
        totalAdvance: monthSalaries.reduce((sum, s) => sum + s.advancePaid, 0),
        totalPaid: monthSalaries.reduce((sum, s) => sum + s.totalPaid, 0),
        staffCount: monthSalaries.length
      });
    }

    const totalYearlyBasicSalary = monthlyData.reduce((sum, m) => sum + m.totalBasicSalary, 0);
    const totalYearlySalary = monthlyData.reduce((sum, m) => sum + m.totalSalary, 0);
    const totalYearlyAdvance = monthlyData.reduce((sum, m) => sum + m.totalAdvance, 0);
    const totalYearlyPaid = monthlyData.reduce((sum, m) => sum + m.totalPaid, 0);

    res.json({
      success: true,
      year: currentYear,
      summary: {
        totalYearlyBasicSalary,
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