const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    month: {
      type: String,
      required: true
    },
    salaryDate: {
      type: Date,
      required: true
    },
    basicSalary: {
      type: Number,
      required: true
    },
    advancePaid: {
      type: Number,
      default: 0
    },
    salaryPaid: {
      type: Number,
      required: true
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    paymentNo: {
      type: String,
      unique: true
    },
    remarks: {
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

module.exports = mongoose.model("Salary", salarySchema);