// controllers/userController.js
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");

// =====================
// CREATE USER
// =====================
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, username, password, phoneNumber, email, role } = req.body;

    // Validate required fields
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ message: "Full name, username, password, and role are required" });
    }

    // 1️⃣ Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 2️⃣ Check if phone number already exists
    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number is already in use" });
      }
    }

    // 3️⃣ Check if email already exists
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // 4️⃣ Create new user
    const newUser = await User.create({
      fullName,
      username,
      password,      // hashed in pre-save hook
      phoneNumber,
      email,
      role,
      status: "active",
    });

    res.status(201).json({
      message: `${role} created successfully`,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL USERS (OPTIONAL: FILTER BY ROLE)
// =====================
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query; // optional query ?role=salesman
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password");
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// =====================
// GET SINGLE USER BY USERNAME
// =====================
exports.getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE USER BY USERNAME
// =====================
exports.updateUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { fullName, newUsername, phoneNumber, email, password, role, status } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Username validation
    if (newUsername && newUsername !== user.username) {
      const exists = await User.findOne({ username: newUsername, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: "Username already taken" });
      user.username = newUsername;
    }

    // Phone validation
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber, _id: { $ne: user._id } });
      if (phoneExists) return res.status(400).json({ message: "Phone number already in use" });
      user.phoneNumber = phoneNumber;
    }

    // Email validation
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (password) user.password = password; // pre-save hook will hash
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// ACTIVATE USER
// =====================
exports.activateUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "active";
    await user.save();
    res.status(200).json({ message: "User activated successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// DEACTIVATE USER
// =====================
exports.deactivateUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "inactive";
    await user.save();
    res.status(200).json({ message: "User deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE USER
// =====================
exports.deleteUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};