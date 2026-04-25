const mongoose = require("mongoose");

// =====================
// SALES ITEM
// =====================
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

// =====================
// SALES INVOICE
// =====================
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

    // =====================
    // BILLING SUMMARY ONLY
    // =====================
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

    // =====================
    // STATUS ONLY (NO PAYMENT TRACKING)
    // =====================
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

module.exports = mongoose.model("Sales", salesSchema);