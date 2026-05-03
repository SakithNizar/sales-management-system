const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    // =====================
    // SYSTEM GENERATED ID (handled in controller)
    // =====================
    customerId: {
      type: String,
      unique: true,
      index: true
    },

    // =====================
    // BASIC DETAILS
    // =====================
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    shopName: {
      type: String,
      required: true,
      trim: true
    },

    shopPhoto: {
      type: String // optional image URL
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },

    whatsapp: {
      type: String
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String // can upgrade to GeoJSON later
    },

    // =====================
    // RELATIONS
    // =====================
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // =====================
    // FINANCIAL SECTION (ERP CORE)
    // =====================
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },

    balance: {
      type: Number,
      default: 0
      // +ve = customer owes money
      // -ve = credit balance (optional system choice)
    },

    // =====================
    // STATUS CONTROL
    // =====================
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    },

    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Customer", customerSchema);