const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    invoiceNo: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    income: {
      type: Number,
      default: 0
    },
    expense: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      required: true
    },
    // Which module created this transaction
    sourceModule: {
      type: String,
      enum: ["expense", "sales", "salary"],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
accountSchema.index({ date: -1 });
accountSchema.index({ sourceModule: 1 });
accountSchema.index({ invoiceNo: 1 });

module.exports = mongoose.model("Account", accountSchema);