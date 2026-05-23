// controllers/advanceController.js
const Advance = require("../models/Advance.model");
const User = require("../models/User.model");
const { addTransaction } = require("../services/accountService");

// ===============================
// ADD ADVANCE (ADMIN ONLY)
// ===============================
exports.createAdvance = async (req, res) => {
  try {
    const { staffId, amount, date, notes } = req.body;

    // Validate required fields
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required"
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid advance amount is required"
      });
    }

    // Check staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }

    // Generate payment number
    const paymentNo = `ADV-${Date.now()}`;

    // Create advance record
    const advance = await Advance.create({
      staffId,
      amount,
      date: date || new Date(),
      paymentNo,
      notes: notes || "",
      createdBy: req.user._id
    });

    // =====================
    // ADD TO ACCOUNT LEDGER (As an expense/advance payment)
    // =====================
    try {
      await addTransaction({
        date: date || new Date(),
        invoiceNo: paymentNo,
        description: `Salary Advance - ${staff.fullName}`,
        income: 0,
        expense: amount,
        sourceModule: "advance",
        sourceId: advance._id,
        enteredBy: req.user._id,
        notes: notes || `Salary advance payment for ${staff.fullName}`
      });
      console.log(`✅ Advance transaction added to accounts for ${staff.fullName} - LKR ${amount}`);
    } catch (accountErr) {
      console.error("Failed to add advance to account ledger:", accountErr);
      // Don't fail the advance creation if account recording fails
      // But still return success for advance creation
    }

    // Populate staff details for response
    const populatedAdvance = await Advance.findById(advance._id)
      .populate("staffId", "fullName username role");

    res.status(201).json({
      success: true,
      message: "Advance added successfully",
      advance: populatedAdvance
    });
  } catch (error) {
    console.error("Error in createAdvance:", error);
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
    console.error("Error in getAllAdvances:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET ADVANCES BY STAFF
// ===============================
exports.getAdvancesByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required"
      });
    }

    const advances = await Advance.find({ staffId })
      .populate("staffId", "fullName username role")
      .sort({ date: -1 });

    res.json({
      success: true,
      advances
    });
  } catch (error) {
    console.error("Error in getAdvancesByStaff:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET SINGLE ADVANCE
// ===============================
exports.getAdvanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await Advance.findById(id)
      .populate("staffId", "fullName username role")
      .populate("createdBy", "fullName username");

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found"
      });
    }

    res.json({
      success: true,
      advance
    });
  } catch (error) {
    console.error("Error in getAdvanceById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// UPDATE ADVANCE
// ===============================
exports.updateAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, notes } = req.body;

    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found"
      });
    }

    const oldAmount = advance.amount;

    // Update fields
    if (amount) advance.amount = amount;
    if (date) advance.date = date;
    if (notes) advance.notes = notes;

    await advance.save();

    // If amount changed, update account ledger
    if (amount && oldAmount !== amount) {
      try {
        const Account = require("../models/Account.model");
        await Account.findOneAndUpdate(
          { sourceModule: "advance", sourceId: advance._id },
          { 
            expense: amount,
            notes: notes || `Salary advance updated - ${advance.paymentNo}`
          }
        );
        console.log(`✅ Advance account transaction updated: ${advance.paymentNo} - Amount changed from ${oldAmount} to ${amount}`);
      } catch (accountErr) {
        console.error("Failed to update account ledger:", accountErr);
      }
    }

    const populatedAdvance = await Advance.findById(advance._id)
      .populate("staffId", "fullName username role");

    res.json({
      success: true,
      message: "Advance updated successfully",
      advance: populatedAdvance
    });
  } catch (error) {
    console.error("Error in updateAdvance:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// DELETE ADVANCE (with account reversal)
// ===============================
exports.deleteAdvance = async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: "Advance not found"
      });
    }

    // =====================
    // DELETE FROM ACCOUNT LEDGER
    // =====================
    try {
      const Account = require("../models/Account.model");
      const deleted = await Account.deleteOne({ 
        sourceModule: "advance", 
        sourceId: advance._id 
      });
      if (deleted.deletedCount > 0) {
        console.log(`✅ Advance account transaction deleted: ${advance.paymentNo}`);
      }
    } catch (accountErr) {
      console.error("Failed to delete from account ledger:", accountErr);
    }

    await Advance.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Advance deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteAdvance:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===============================
// GET TOTAL ADVANCES FOR STAFF
// ===============================
exports.getStaffAdvanceTotal = async (req, res) => {
  try {
    const { staffId } = req.params;

    const advances = await Advance.find({ staffId });
    const totalAmount = advances.reduce((sum, adv) => sum + adv.amount, 0);
    const advanceCount = advances.length;

    res.json({
      success: true,
      staffId,
      totalAmount,
      advanceCount,
      advances
    });
  } catch (error) {
    console.error("Error in getStaffAdvanceTotal:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};