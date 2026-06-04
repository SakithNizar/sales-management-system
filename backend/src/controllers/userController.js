const User = require("../models/User.model");
const Route = require("../models/route.model");

// =====================
// CREATE USER
// =====================
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, username, password, phoneNumber, email, role, basicSalary } = req.body;

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
      basicSalary: basicSalary || 0,
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
// GET CURRENT USER PROFILE (for logged-in user)
// =====================
exports.getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
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
// GET USER BY USERNAME (with access control)
// =====================
exports.getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("assignedRoutes");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow access if:
    // 1. User is admin, OR
    // 2. User is requesting their own profile
    if (req.user.role !== "admin" && req.user.username !== user.username) {
      return res.status(403).json({ 
        message: "Access denied: You can only view your own profile" 
      });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE USER (UPDATED WITH basicSalary)
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
      status,
      basicSalary
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
    
    // =====================
    // Basic Salary update
    // =====================
    if (basicSalary !== undefined) {
      if (basicSalary < 0) {
        return res.status(400).json({ 
          message: "Basic salary cannot be negative" 
        });
      }
      user.basicSalary = basicSalary;
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "User updated successfully",
      user: userResponse
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

// =====================
// BULK UPDATE BASIC SALARY (Admin utility)
// =====================
exports.bulkUpdateBasicSalary = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { userId, basicSalary }
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        message: "Please provide an array of updates with userId and basicSalary"
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const user = await User.findById(update.userId);
        if (!user) {
          results.failed.push({
            userId: update.userId,
            reason: "User not found"
          });
          continue;
        }

        if (update.basicSalary < 0) {
          results.failed.push({
            userId: update.userId,
            reason: "Basic salary cannot be negative"
          });
          continue;
        }

        user.basicSalary = update.basicSalary;
        await user.save();
        
        results.success.push({
          userId: update.userId,
          username: user.username,
          basicSalary: user.basicSalary
        });
      } catch (err) {
        results.failed.push({
          userId: update.userId,
          reason: err.message
        });
      }
    }

    res.status(200).json({
      message: "Bulk salary update completed",
      results
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL STAFF WITH BASIC SALARY (for dropdown in salary creation)
// =====================
exports.getAllStaffWithSalary = async (req, res, next) => {
  try {
    const staff = await User.find({ 
      role: { $in: ["salesman", "production_manager", "store_manager"] },
      status: "active"
    })
    .select("fullName username basicSalary role status")
    .sort("fullName");

    res.status(200).json({
      success: true,
      count: staff.length,
      staff: staff
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// EXPORT ALL FUNCTIONS
// =====================