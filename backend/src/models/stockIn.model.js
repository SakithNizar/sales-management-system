const mongoose = require("mongoose");

const stockInSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  source: {
    type: String,
    enum: ["Production", "Purchase"],
    required: true,
  },
  manager: {
    type: String,
    required: true, // auto from login
    default: "Unknown",
  },
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      batchNo: String,      // only for finished goods
      quantity: { type: Number, required: true, min: 1 },
      unitCost: { type: Number, required: true, min: 0 },
      totalCost: Number,     // auto-calc
      expiryDate: Date,
    },
  ],
}, { timestamps: true });

// Auto calculate total cost for each item
stockInSchema.pre("save", function () {
  this.items.forEach((i) => {
    i.totalCost = i.quantity * i.unitCost;
  });
});

module.exports = mongoose.model("StockIn", stockInSchema);