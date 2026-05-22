// models/sales.model.js - SIMPLIFIED VERSION (No middleware)

const mongoose = require("mongoose");

const salesItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const salesSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
      index: true
    },
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [salesItemSchema],
    subTotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid"
    },
    status: {
      type: String,
      enum: ["Draft", "Completed", "Cancelled"],
      default: "Completed"
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// NO PRE-SAVE MIDDLEWARE - calculations handled in controller

salesSchema.index({ customer: 1, invoiceDate: -1 });
salesSchema.index({ salesman: 1, invoiceDate: -1 });
salesSchema.index({ paymentStatus: 1 });
salesSchema.index({ invoiceId: 1 });

module.exports = mongoose.model("Sales", salesSchema);