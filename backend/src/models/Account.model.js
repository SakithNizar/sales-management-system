// models/Account.model.js
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoiceNo: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    income: {
      type: Number,
      default: 0,
      min: 0,
    },
    expense: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    sourceModule: {
      type: String,
      enum: ["sales", "payment", "expense", "salary", "advance", "production"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sourceModule",
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
accountSchema.index({ date: -1 });
accountSchema.index({ sourceModule: 1, sourceId: 1 });
accountSchema.index({ invoiceNo: 1 });

module.exports = mongoose.model("Account", accountSchema);