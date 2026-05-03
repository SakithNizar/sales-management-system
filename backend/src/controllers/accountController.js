const Account = require("../models/Account.model");

// ===============================
// HELPER: Get last balance
// ===============================
const getLastBalance = async () => {
  const lastTransaction = await Account.findOne().sort({ date: -1 });
  return lastTransaction?.balance || 0;
};

// ===============================
// ADD TRANSACTION (called by other modules)
// ===============================
exports.addTransaction = async ({
  date,
  invoiceNo,
  description,
  income = 0,
  expense = 0,
  sourceModule,
  sourceId,
  enteredBy,
  notes = ""
}) => {
  try {
    const lastBalance = await getLastBalance();

    // Calculate new balance
    let newBalance = lastBalance;
    if (income > 0) {
      newBalance = lastBalance + income;
    } else if (expense > 0) {
      newBalance = lastBalance - expense;
    }

    // Calculate total amount (running total)
    const totalAmount = lastBalance + income - expense;

    // Create transaction
    const transaction = await Account.create({
      date,
      invoiceNo,
      description,
      income,
      expense,
      totalAmount,
      balance: newBalance,
      sourceModule,
      sourceId,
      enteredBy,
      notes
    });

    return transaction;
  } catch (error) {
    console.error("Account transaction error:", error);
    throw error;
  }
};

// ===============================
// GET DASHBOARD SUMMARY
// ===============================
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's transactions
    const todayTransactions = await Account.find({
      date: { $gte: startOfToday }
    });

    const totalIncomeToday = todayTransactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpenseToday = todayTransactions.reduce((sum, t) => sum + t.expense, 0);

    // This month's transactions
    const monthTransactions = await Account.find({
      date: { $gte: startOfMonth }
    });

    const totalIncomeMonth = monthTransactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpenseMonth = monthTransactions.reduce((sum, t) => sum + t.expense, 0);
    const monthlyProfit = totalIncomeMonth - totalExpenseMonth;

    // Current balance
    const currentBalance = await getLastBalance();

    res.json({
      success: true,
      dashboard: {
        totalIncomeToday,
        totalExpenseToday,
        currentBalance,
        monthlyProfit
      }
    });
  } catch (error) {
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
      .sort({ date: -1 });

    // Calculate totals
    const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      },
      transactions
    });
  } catch (error) {
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
    const { startDate, endDate, type } = req.query;
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

    const transactions = await Account.find(filter)
      .populate("enteredBy", "fullName username")
      .sort({ date: -1 });

    // Calculate totals
    const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      },
      transactions
    });
  } catch (error) {
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

    const transactions = await Account.find({
      date: { $gte: startDate, $lte: endDate }
    });

    const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);

    // Group by source module
    const salesIncome = transactions
      .filter(t => t.sourceModule === "sales")
      .reduce((sum, t) => sum + t.income, 0);

    const expenseTotal = transactions
      .filter(t => t.sourceModule === "expense")
      .reduce((sum, t) => sum + t.expense, 0);

    const salaryTotal = transactions
      .filter(t => t.sourceModule === "salary")
      .reduce((sum, t) => sum + t.expense, 0);

    res.json({
      success: true,
      report: {
        year,
        month,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        breakdown: {
          salesIncome,
          expenseTotal,
          salaryTotal
        }
      },
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};