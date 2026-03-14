const mongoose = require("mongoose");

// Default expense categories
const DEFAULT_CATEGORIES = [
  "Raw Material",
  "Packaging",
  "Transport",
  "Utility",
  "Maintenance",
  "Labour",
  "Office Expense",
  "Other"
];

// Payment methods
const PAYMENT_METHODS = ["Cash", "Bank", "Credit"];

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    category: {
      type: String,
      enum: DEFAULT_CATEGORIES,
      required: [true, "Category is required"],
    },
    subject: {
      type: String,
      required: [true, "Purchase / Subject Name is required"],
    },
    invoiceNo: {
      type: String,
      required: [true, "Invoice number is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: [true, "Payment method is required"],
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = { Expense, DEFAULT_CATEGORIES, PAYMENT_METHODS };