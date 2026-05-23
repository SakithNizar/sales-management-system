// controllers/expenseController.js
const { Expense, DEFAULT_CATEGORIES, PAYMENT_METHODS } = require("../models/Expense.model");
const User = require("../models/User.model");
const { addTransaction } = require("../services/accountService");

// =====================
// ADD NEW EXPENSE
// =====================
exports.addExpense = async (req, res, next) => {
  try {
    const { date, category, subject, invoiceNo, amount, paymentMethod } = req.body;

    // Validation
    if (!category || !subject || !invoiceNo || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!DEFAULT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    const expenseDate = date || new Date();
    
    const expense = await Expense.create({
      date: expenseDate,
      category,
      subject,
      invoiceNo,
      amount,
      paymentMethod,
      enteredBy: req.user.id,
    });

    // =====================
    // ADD TO ACCOUNT LEDGER
    // =====================
    try {
      await addTransaction({
        date: expenseDate,
        invoiceNo: invoiceNo,
        description: `${category} - ${subject}`,
        income: 0,
        expense: amount,
        sourceModule: "expense",
        sourceId: expense._id,
        enteredBy: req.user.id,
        notes: `Expense: ${subject} (${category})`
      });
      console.log(`✅ Expense transaction added to accounts: ${subject} - LKR ${amount}`);
    } catch (accountErr) {
      console.error("Failed to add expense to account ledger:", accountErr);
      // Don't fail the expense creation if account recording fails
    }

    // Populate enteredBy details for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate("enteredBy", "fullName username role");

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense: populatedExpense
    });
  } catch (err) {
    console.error("Error in addExpense:", err);
    next(err);
  }
};

// =====================
// GET SINGLE EXPENSE
// =====================
exports.getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate("enteredBy", "fullName username role");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.status(200).json({
      success: true,
      expense
    });
  } catch (err) {
    console.error("Error in getExpenseById:", err);
    next(err);
  }
};

// =====================
// UPDATE EXPENSE
// =====================
exports.updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, category, subject, invoiceNo, amount, paymentMethod } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    if (category && !DEFAULT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    const oldAmount = expense.amount;
    const newAmount = amount || expense.amount;

    // Update fields
    if (date) expense.date = date;
    if (category) expense.category = category;
    if (subject) expense.subject = subject;
    if (invoiceNo) expense.invoiceNo = invoiceNo;
    if (amount) expense.amount = newAmount;
    if (paymentMethod) expense.paymentMethod = paymentMethod;

    await expense.save();

    // =====================
    // UPDATE ACCOUNT LEDGER IF AMOUNT CHANGED
    // =====================
    if (oldAmount !== newAmount) {
      try {
        const Account = require("../models/Account.model");
        await Account.findOneAndUpdate(
          { sourceModule: "expense", sourceId: expense._id },
          { 
            expense: newAmount,
            description: `${expense.category} - ${expense.subject}`,
            notes: `Expense updated: ${expense.subject} (${expense.category})`
          }
        );
        console.log(`✅ Expense account transaction updated: ${expense.invoiceNo} - Amount changed from ${oldAmount} to ${newAmount}`);
      } catch (accountErr) {
        console.error("Failed to update account ledger:", accountErr);
      }
    }

    const populatedExpense = await Expense.findById(expense._id)
      .populate("enteredBy", "fullName username role");

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: populatedExpense
    });
  } catch (err) {
    console.error("Error in updateExpense:", err);
    next(err);
  }
};

// =====================
// DELETE EXPENSE
// =====================
exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    // =====================
    // DELETE FROM ACCOUNT LEDGER
    // =====================
    try {
      const Account = require("../models/Account.model");
      const deleted = await Account.deleteOne({ 
        sourceModule: "expense", 
        sourceId: expense._id 
      });
      if (deleted.deletedCount > 0) {
        console.log(`✅ Expense account transaction deleted: ${expense.invoiceNo}`);
      }
    } catch (accountErr) {
      console.error("Failed to delete from account ledger:", accountErr);
    }

    await expense.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "Expense deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteExpense:", err);
    next(err);
  }
};

// =====================
// GET ALL EXPENSES (OPTIONAL FILTERS)
// =====================
exports.getExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    let filter = {};

    // Date filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Category filter
    if (category && DEFAULT_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    const expenses = await Expense.find(filter)
      .populate("enteredBy", "fullName username role")
      .sort({ date: -1 });

    // Calculate summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = {};
    
    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    res.status(200).json({
      success: true,
      summary: {
        totalExpenses: expenses.length,
        totalAmount,
        categoryBreakdown
      },
      expenses
    });
  } catch (err) {
    console.error("Error in getExpenses:", err);
    next(err);
  }
};

// =====================
// GET EXPENSE TOTALS (DAILY / MONTHLY / YEARLY)
// =====================
exports.getExpenseTotals = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [dailyTotal] = await Expense.aggregate([
      { $match: { date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [monthlyTotal] = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [yearlyTotal] = await Expense.aggregate([
      { $match: { date: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get category totals for current month
    const categoryTotals = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      totals: {
        daily: dailyTotal?.total || 0,
        monthly: monthlyTotal?.total || 0,
        yearly: yearlyTotal?.total || 0
      },
      categoryBreakdown: categoryTotals
    });
  } catch (err) {
    console.error("Error in getExpenseTotals:", err);
    next(err);
  }
};

// =====================
// GET EXPENSES BY CATEGORY
// =====================
exports.getExpensesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { startDate, endDate } = req.query;

    if (!category || !DEFAULT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    let filter = { category };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate("enteredBy", "fullName username role")
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      success: true,
      category,
      summary: {
        totalExpenses: expenses.length,
        totalAmount
      },
      expenses
    });
  } catch (err) {
    console.error("Error in getExpensesByCategory:", err);
    next(err);
  }
};

// =====================
// GET MONTHLY EXPENSE REPORT
// =====================
exports.getMonthlyExpenseReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required"
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("enteredBy", "fullName username role");

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    res.status(200).json({
      success: true,
      report: {
        year,
        month,
        totalExpenses: expenses.length,
        totalAmount,
        categoryBreakdown
      },
      expenses
    });
  } catch (err) {
    console.error("Error in getMonthlyExpenseReport:", err);
    next(err);
  }
};