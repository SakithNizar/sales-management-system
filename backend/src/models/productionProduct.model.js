const mongoose = require("mongoose");

const productionProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  shelfLifeDays: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("ProductionProduct", productionProductSchema);