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
  lowercase: true, // stored as lowercase
  minlength: [3, "Username must be at least 3 characters"],
  maxlength: [20, "Username cannot exceed 20 characters"],
  match: [/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed"]
},

password: {
  type: String,
  required: [true, "Password is required"],
  minlength: [8, "Password must be at least 8 characters"],
  select: false, // Crucial for security
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
      return /^0\d{9}$/.test(v); // must start with 0 + 9 digits
    },
    message: "Phone number must be a valid 10-digit Sri Lankan number starting with 0"
  }
},

role: {
type: String,
enum: ["admin", "salesman"],
default: "salesman", // default to salesman
},

status: {
type: String,
enum: ["active", "inactive"],
default: "active",
},
},
  
{
timestamps: true, 
}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is new or modified

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// During login Compare Passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model
const User = mongoose.model("User", userSchema);
module.exports = User;
