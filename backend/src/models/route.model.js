const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

// 🔒 Prevent duplicate routes in same city
routeSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("Route", routeSchema);