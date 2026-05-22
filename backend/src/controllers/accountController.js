// controllers/accountController.js
const Account = require("../models/Account.model");
const Sales = require("../models/sales.model");
const Payment = require("../models/payment.model");
const { addTransaction, updateTransaction, deleteTransaction } = require("../services/accountService");

// Re-export for other modules
exports.addTransaction = addTransaction;

// ===============================
// GET DASHBOARD SUMMARY
// ===============================
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // =====================
    // EXPECTED INCOME (Sales Invoices)
    // =====================
    const expectedIncome = await Sales.aggregate([
      { $match: { invoiceDate: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // =====================
    // RECEIVED INCOME (Payments)
    // =====================
    const receivedIncome = await Payment.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // =====================
    // TOTAL EXPENSES (Expense + Salary + Advance)
    // =====================
    const totalExpenses = await Account.aggregate([
      { $match: { 
        date: { $gte: startOfYear },
        expense: { $gt: 0 }
      }},
      { $group: { _id: null, total: { $sum: "$expense" } } }
    ]);

    // =====================
    // BREAKDOWN BY EXPENSE TYPE
    // =====================
    const expenseBreakdown = await Account.aggregate([
      { $match: { 
        date: { $gte: startOfYear },
        expense: { $gt: 0 }
      }},
      { $group: { _id: "$sourceModule", total: { $sum: "$expense" } } }
    ]);

    // Today's transactions
    const todayTransactions = await Account.find({
      date: { $gte: startOfToday }
    });

    const totalIncomeToday = todayTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpenseToday = todayTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);

    // This month's transactions
    const monthTransactions = await Account.find({
      date: { $gte: startOfMonth }
    });

    const totalIncomeMonth = monthTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpenseMonth = monthTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    const monthlyProfit = totalIncomeMonth - totalExpenseMonth;

    // Current balance
    const lastTransaction = await Account.findOne().sort({ date: -1, createdAt: -1 });
    const currentBalance = lastTransaction?.balance || 0;

    // Format expense breakdown
    const breakdown = {
      expenses: expenseBreakdown.find(b => b._id === "expense")?.total || 0,
      salary: expenseBreakdown.find(b => b._id === "salary")?.total || 0,
      advance: expenseBreakdown.find(b => b._id === "advance")?.total || 0,
      production: expenseBreakdown.find(b => b._id === "production")?.total || 0
    };

    res.status(200).json({
      success: true,
      dashboard: {
        // Main Summary
        expectedIncome: expectedIncome[0]?.total || 0,
        receivedIncome: receivedIncome[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        netProfit: (receivedIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
        
        // Daily Summary
        totalIncomeToday,
        totalExpenseToday,
        
        // Monthly Summary
        totalIncomeMonth,
        totalExpenseMonth,
        monthlyProfit,
        
        // Current Balance
        currentBalance,
        
        // Expense Breakdown
        expenseBreakdown: breakdown
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
// GET ALL TRANSACTIONS
// ===============================
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Account.find()
      .populate("enteredBy", "fullName username")
      .sort({ date: -1, createdAt: -1 });

    // Calculate summary with categorization
    const expectedIncomeTotal = transactions
      .filter(t => t.sourceModule === "sales")
      .reduce((sum, t) => sum + (t.income || 0), 0);
    
    const receivedIncomeTotal = transactions
      .filter(t => t.sourceModule === "payment")
      .reduce((sum, t) => sum + (t.income || 0), 0);
    
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    
    const expenseBreakdown = {
      expense: transactions.filter(t => t.sourceModule === "expense").reduce((sum, t) => sum + (t.expense || 0), 0),
      salary: transactions.filter(t => t.sourceModule === "salary").reduce((sum, t) => sum + (t.expense || 0), 0),
      advance: transactions.filter(t => t.sourceModule === "advance").reduce((sum, t) => sum + (t.expense || 0), 0),
      production: transactions.filter(t => t.sourceModule === "production").reduce((sum, t) => sum + (t.expense || 0), 0)
    };

    res.status(200).json({
      success: true,
      summary: {
        expectedIncome: expectedIncomeTotal,
        receivedIncome: receivedIncomeTotal,
        totalExpense,
        netProfit: receivedIncomeTotal - totalExpense,
        expenseBreakdown
      },
      transactions
    });
  } catch (error) {
    console.error("Error in getAllTransactions:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET FILTERED TRANSACTIONS
// ===============================
exports.getFilteredTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, sourceModule } = req.query;
    let filter = {};

    // Date filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Type filter (income or expense)
    if (type === "income") {
      filter.income = { $gt: 0 };
    } else if (type === "expense") {
      filter.expense = { $gt: 0 };
    }

    // Source module filter
    if (sourceModule && sourceModule !== "all") {
      filter.sourceModule = sourceModule;
    }

    const transactions = await Account.find(filter)
      .populate("enteredBy", "fullName username")
      .sort({ date: -1, createdAt: -1 });

    // Calculate filtered summary
    const expectedIncomeTotal = transactions
      .filter(t => t.sourceModule === "sales")
      .reduce((sum, t) => sum + (t.income || 0), 0);
    
    const receivedIncomeTotal = transactions
      .filter(t => t.sourceModule === "payment")
      .reduce((sum, t) => sum + (t.income || 0), 0);
    
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    
    const expenseBreakdown = {
      expense: transactions.filter(t => t.sourceModule === "expense").reduce((sum, t) => sum + (t.expense || 0), 0),
      salary: transactions.filter(t => t.sourceModule === "salary").reduce((sum, t) => sum + (t.expense || 0), 0),
      advance: transactions.filter(t => t.sourceModule === "advance").reduce((sum, t) => sum + (t.expense || 0), 0),
      production: transactions.filter(t => t.sourceModule === "production").reduce((sum, t) => sum + (t.expense || 0), 0)
    };

    res.status(200).json({
      success: true,
      summary: {
        expectedIncome: expectedIncomeTotal,
        receivedIncome: receivedIncomeTotal,
        totalExpense,
        netProfit: receivedIncomeTotal - totalExpense,
        expenseBreakdown
      },
      transactions
    });
  } catch (error) {
    console.error("Error in getFilteredTransactions:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET TRANSACTION BY ID
// ===============================
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Account.findById(id)
      .populate("enteredBy", "fullName username");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error("Error in getTransactionById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// DELETE TRANSACTION (Admin only)
// ===============================
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTransaction(id);
    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteTransaction:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET MONTHLY REPORT
// ===============================
exports.getMonthlyReport = async (req, res) => {
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

    // Get sales invoices for expected income
    const salesInvoices = await Sales.find({
      invoiceDate: { $gte: startDate, $lte: endDate }
    });
    const expectedIncome = salesInvoices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Get payments for received income
    const payments = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const receivedIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get expenses from account ledger
    const transactions = await Account.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("enteredBy", "fullName username");

    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    
    // Expense breakdown
    const expenseBreakdown = {
      expense: transactions.filter(t => t.sourceModule === "expense").reduce((sum, t) => sum + (t.expense || 0), 0),
      salary: transactions.filter(t => t.sourceModule === "salary").reduce((sum, t) => sum + (t.expense || 0), 0),
      advance: transactions.filter(t => t.sourceModule === "advance").reduce((sum, t) => sum + (t.expense || 0), 0),
      production: transactions.filter(t => t.sourceModule === "production").reduce((sum, t) => sum + (t.expense || 0), 0)
    };

    // Income breakdown by source module
    const incomeBreakdown = {
      sales: transactions.filter(t => t.sourceModule === "sales").reduce((sum, t) => sum + (t.income || 0), 0),
      payment: transactions.filter(t => t.sourceModule === "payment").reduce((sum, t) => sum + (t.income || 0), 0)
    };

    res.status(200).json({
      success: true,
      report: {
        year,
        month,
        expectedIncome,
        receivedIncome,
        totalExpense,
        netProfit: receivedIncome - totalExpense,
        breakdown: {
          income: incomeBreakdown,
          expense: expenseBreakdown
        }
      },
      transactions
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
// GET YEARLY REPORT
// ===============================
exports.getYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year is required"
      });
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const monthlyData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);
      
      // Expected income from sales
      const salesInvoices = await Sales.find({
        invoiceDate: { $gte: monthStart, $lte: monthEnd }
      });
      const expectedIncome = salesInvoices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
      // Received income from payments
      const payments = await Payment.find({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      const receivedIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Expenses from account
      const accountTransactions = await Account.find({
        date: { $gte: monthStart, $lte: monthEnd }
      });
      const totalExpense = accountTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);

      monthlyData.push({
        month: i + 1,
        monthName: new Date(year, i).toLocaleString('default', { month: 'long' }),
        expectedIncome,
        receivedIncome,
        totalExpense,
        netProfit: receivedIncome - totalExpense
      });
    }

    // Yearly totals
    const yearlyExpectedIncome = monthlyData.reduce((sum, m) => sum + m.expectedIncome, 0);
    const yearlyReceivedIncome = monthlyData.reduce((sum, m) => sum + m.receivedIncome, 0);
    const yearlyTotalExpense = monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
    const yearlyNetProfit = yearlyReceivedIncome - yearlyTotalExpense;

    res.status(200).json({
      success: true,
      year,
      summary: {
        expectedIncome: yearlyExpectedIncome,
        receivedIncome: yearlyReceivedIncome,
        totalExpense: yearlyTotalExpense,
        netProfit: yearlyNetProfit
      },
      monthlyData
    });
  } catch (error) {
    console.error("Error in getYearlyReport:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET INCOME VS EXPENSE SUMMARY
// ===============================
exports.getIncomeExpenseSummary = async (req, res) => {
  try {
    const { period } = req.query; // daily, monthly, yearly
    
    let startDate, endDate;
    const today = new Date();
    
    switch(period) {
      case 'daily':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const expectedIncome = await Sales.aggregate([
      { $match: { invoiceDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const receivedIncome = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalExpense = await Account.aggregate([
      { $match: { 
        date: { $gte: startDate, $lte: endDate },
        expense: { $gt: 0 }
      }},
      { $group: { _id: null, total: { $sum: "$expense" } } }
    ]);

    res.status(200).json({
      success: true,
      period,
      summary: {
        expectedIncome: expectedIncome[0]?.total || 0,
        receivedIncome: receivedIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
        netProfit: (receivedIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        collectionRate: expectedIncome[0]?.total ? 
          ((receivedIncome[0]?.total || 0) / expectedIncome[0]?.total * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error("Error in getIncomeExpenseSummary:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};