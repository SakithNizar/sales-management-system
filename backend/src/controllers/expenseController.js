const { Expense, DEFAULT_CATEGORIES, PAYMENT_METHODS } = require("../models/Expense.model");
const User = require("../models/User.model");

// =====================
// ADD NEW EXPENSE
// =====================
exports.addExpense = async (req, res, next) => {
  try {
    const { date, category, subject, invoiceNo, amount, paymentMethod } = req.body;

    // Validation
    if (!category || !subject || !invoiceNo || !amount || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!DEFAULT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const expense = await Expense.create({
     date: date || new Date(),
      category,
      subject,
      invoiceNo,
      amount,
      paymentMethod,
      enteredBy: req.user.id, // auto from logged-in admin
    });

    res.status(201).json({
      message: "Expense added successfully",
      expense,
    });
  } catch (err) {
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

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (category && DEFAULT_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    const expenses = await Expense.find(filter)
      .populate("enteredBy", "fullName username role")
      .sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (err) {
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
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (category && !DEFAULT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    expense.date = date || expense.date;
    expense.category = category || expense.category;
    expense.subject = subject || expense.subject;
    expense.invoiceNo = invoiceNo || expense.invoiceNo;
    expense.amount = amount || expense.amount;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;

    await expense.save();

    res.status(200).json({ message: "Expense updated successfully", expense });
  } catch (err) {
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
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    await expense.deleteOne();
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (err) {
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

    res.status(200).json({
      totalToday: dailyTotal?.total || 0,
      totalThisMonth: monthlyTotal?.total || 0,
      totalThisYear: yearlyTotal?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};