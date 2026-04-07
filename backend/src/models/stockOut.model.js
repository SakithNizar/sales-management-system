const mongoose = require("mongoose");

const stockOutItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },

  // ✅ Optional → only used for Finished Goods
  batchNo: {
    type: String,
    default: null
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  unitCost: {
    type: Number,
    required: true,
    min: 0
  },

  totalCost: {
    type: Number,
    required: true
  },

  // ✅ Optional (mainly for batch tracking)
  expiryDate: {
    type: Date,
    default: null
  }
});

const stockOutSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },

    invoiceNo: {
      type: String,
      required: true,
      unique: true
    },

    manager: {
      type: String,
      required: true
    },

    items: [stockOutItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockOut", stockOutSchema);