const mongoose = require("mongoose");

const productionBatchSchema = new mongoose.Schema(
{
  date: {
    type: Date,
    required: [true, "Production date is required"]
  },

  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",   // <-- Changed
    required: true
  },

  batchNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    type: Number
  },

  expiryDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Produced", "Packed", "Dispatched"],
    default: "Produced"
  },

  notes: {
    type: String,
    trim: true
  }
},
{ timestamps: true }
);

// Auto calculate total cost
productionBatchSchema.pre("save", function () {
  this.totalCost = this.quantity * this.unitCost;
});

// Index
productionBatchSchema.index({ item: 1 });
productionBatchSchema.index({ batchNo: 1 });
productionBatchSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("ProductionBatch", productionBatchSchema);