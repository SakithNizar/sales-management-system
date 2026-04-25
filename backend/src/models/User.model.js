const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User schema
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [50, "Full name must be at most 50 characters"],
      match: [/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"]
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed"]
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: function(password) {
          return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
        },
        message: "Password must contain at least one letter and one number"
      }
    },

    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return /^0\d{9}$/.test(v);
        },
        message: "Phone number must be a valid 10-digit Sri Lankan number starting with 0"
      }
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return /^([\w-.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
        },
        message: "Invalid email format"
      }
    },

    role: {
      type: String,
      enum: ["admin", "production_manager", "salesman", "store_manager"],
      default: "salesman"
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    assignedRoutes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route"
  }
]

  
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model
const User = mongoose.model("User", userSchema);
module.exports = User;