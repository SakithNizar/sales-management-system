const Advance = require("../models/Advance.model");
const User = require("../models/User.model");

// ===============================
// ADD ADVANCE (ADMIN ONLY)
// ===============================
exports.createAdvance = async (req, res) => {
  try {
    const { staffId, amount, date, notes } = req.body;

    // Check staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Generate payment number
    const paymentNo = "ADV-" + Date.now();

    const advance = await Advance.create({
      staffId,
      amount,
      date,
      paymentNo,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Advance added successfully",
      advance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET ALL ADVANCES
// ===============================
exports.getAllAdvances = async (req, res) => {
  try {
    const advances = await Advance.find()
      .populate("staffId", "fullName username role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      advances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET ADVANCES BY STAFF
// ===============================
exports.getAdvancesByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const advances = await Advance.find({ staffId })
      .populate("staffId", "fullName username role")
      .sort({ date: -1 });

    res.json({
      success: true,
      advances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};