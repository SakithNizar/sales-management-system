const User = require("../models/User.model");
const jwt = require("jsonwebtoken");

/**
 * @desc Login any user (Admin, Production Manager, Salesman, Store Manager)
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // 2️⃣ Find user (include password for comparison)
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // 3️⃣ Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Account is inactive. Contact admin.",
      });
    }

    // 4️⃣ Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // 5️⃣ Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // include role for permission checks
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // 6️⃣ Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================
// LOGOUT USER
// =====================
exports.logout = async (req, res) => {
  try {
    // If using JWT in client (most likely your setup)
    // Just tell client to remove token
    res.status(200).json({
      message: "Logout successful. Please remove token from client.",
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging out" });
  }
};