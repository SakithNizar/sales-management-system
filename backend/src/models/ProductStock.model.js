const mongoose = require('mongoose');

const productStockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    batchNumber: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    expiryDate: {
      type: Date,
      required: true
    },

    supplierName: {
      type: String
    },

    receivedDate: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ['active', 'expired', 'finished'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductStock', productStockSchema);
