const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    category: {
      type: String,
      enum: ["Raw Material", "Finished Good"],
      required: true
    },

    unit: {
      type: String,
      required: true,
      trim: true
    },

    // =====================
    // SELLING PRICE (USED IN BILLING)
    // =====================
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },

    shelfLifeDays: {
      type: Number,
      default: 0
    },

    hasBatch: {
      type: Boolean,
      default: false
    },

    minimumLevel: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);