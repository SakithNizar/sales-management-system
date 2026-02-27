const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/**
 * Protect routes - only allow authenticated users
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1️⃣ Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // 2️⃣ Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Find user in DB and attach to req
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // now controllers can access user info
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/**
 * Restrict routes to specific roles (optional for later)
 * Usage: restrictTo("admin") or restrictTo("admin", "salesman")
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 1. Check if the user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Access denied: You do not have permission to perform this action" 
      });
    }

    // 2. Check if account was deactivated while logged in
    if (req.user.status !== "active") {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact the admin." 
      });
    }

    // 3. Everything is fine → call next middleware/controller
    next();
  };
};
