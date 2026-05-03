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
      required: true
    },
    paymentNo: {
      type: String,
      unique: true
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
  { timestamps: true }
);

module.exports = mongoose.model("Advance", advanceSchema);