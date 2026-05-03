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
      required: true
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sales",
      required: true
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

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank", "Cheque"],
      default: "Cash"
    },

    notes: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);