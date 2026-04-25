const User = require("../models/User.model");
const Route = require("../models/route.model");

// =====================
// CREATE USER
// =====================
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, username, password, phoneNumber, email, role } = req.body;

    if (!fullName || !username || !password || !role) {
      return res.status(400).json({
        message: "Full name, username, password, and role are required"
      });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number is already in use" });
      }
    }

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    const newUser = await User.create({
      fullName,
      username,
      password,
      phoneNumber,
      email,
      role,
      status: "active",
    });

    res.status(201).json({
      message: `${role} created successfully`,
      user: newUser
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL USERS
// =====================
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select("-password")
      .populate("assignedRoutes");

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// =====================
// ASSIGN ROUTES TO SALESMAN (SEPARATE API)
// =====================
exports.assignRoutesToSalesman = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { routeIds } = req.body;

    const user = await User.findById(userId);

    if (!user || user.role !== "salesman") {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // 1️⃣ Check if any route is already assigned to another salesman
    const existingAssignment = await User.findOne({
      role: "salesman",
      _id: { $ne: userId },
      assignedRoutes: { $in: routeIds }
    });

    if (existingAssignment) {
      return res.status(400).json({
        message: "One or more routes are already assigned to another salesman"
      });
    }

    // 2️⃣ Validate routes exist
    const routes = await Route.find({
      _id: { $in: routeIds }
    });

    if (routes.length !== routeIds.length) {
      return res.status(400).json({
        message: "Invalid routes provided"
      });
    }

    // 3️⃣ Assign routes
    user.assignedRoutes = routeIds;
    await user.save();

    res.status(200).json({
      message: "Routes assigned successfully",
      assignedRoutes: user.assignedRoutes
    });

  } catch (err) {
    next(err);
  }
};
// =====================
// GET USER BY USERNAME
// =====================
exports.getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("assignedRoutes");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE USER (NO ROUTE LOGIC)
// =====================
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      fullName,
      newUsername,
      phoneNumber,
      email,
      password,
      role,
      status
    } = req.body;

    // =====================
    // Username update (safe check)
    // =====================
    if (newUsername && newUsername !== user.username) {
      const exists = await User.findOne({
        username: newUsername,
        _id: { $ne: user._id }
      });

      if (exists) {
        return res.status(400).json({ message: "Username already taken" });
      }

      user.username = newUsername;
    }

    // =====================
    // Phone validation
    // =====================
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({
        phoneNumber,
        _id: { $ne: user._id }
      });

      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }

      user.phoneNumber = phoneNumber;
    }

    // =====================
    // Email validation
    // =====================
    if (email && email !== user.email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id }
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }

      user.email = email;
    }

    // =====================
    // Basic field updates
    // =====================
    if (fullName) user.fullName = fullName;
    if (password) user.password = password; // hashed in pre-save hook
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user
    });

  } catch (err) {
    next(err);
  }
};
// =====================
// ACTIVATE USER
// =====================
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });

  } catch (err) {
    next(err);
  }
};