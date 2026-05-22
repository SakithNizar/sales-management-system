// models/payment.model.js - FIXED VERSION (No pre-save middleware)

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    receiptId: {
      type: String,
      unique: true,
      index: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sales",
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
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: function(v) {
          return v > 0;
        },
        message: "Amount must be greater than 0"
      }
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank", "Online", "Cheque"],
      default: "Cash"
    },

    referenceNo: {
      type: String,
      trim: true,
      default: null
    },

    paymentDate: {
      type: Date,
      default: Date.now
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    isReversed: {
      type: Boolean,
      default: false
    },

    reversedAt: {
      type: Date,
      default: null
    },

    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

// =====================
// NO PRE-SAVE MIDDLEWARE - All validations handled in controller
// =====================

// =====================
// VIRTUAL: Format amount with currency
// =====================
paymentSchema.virtual('formattedAmount').get(function() {
  return `LKR ${this.amount?.toLocaleString() || 0}`;
});

// =====================
// VIRTUAL: Format date
// =====================
paymentSchema.virtual('formattedDate').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString() : 'N/A';
});

// =====================
// INDEXES FOR BETTER PERFORMANCE
// =====================
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ invoice: 1, createdAt: -1 });
paymentSchema.index({ salesman: 1, createdAt: -1 });
paymentSchema.index({ receiptId: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ isReversed: 1 });

module.exports = mongoose.model("Payment", paymentSchema);