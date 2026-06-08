const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    month: {
      type: String,
      required: true
    },
    paymentNo: {
      type: String,
      unique: true,
      default: function() {
        return `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    },
    notes: {
      type: String,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Advance", advanceSchema);