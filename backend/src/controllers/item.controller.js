const Item = require("../models/item.model");

// =====================
// 1. CREATE ITEM
// =====================
exports.createItem = async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      sellingPrice,
      shelfLifeDays,
      minimumLevel
    } = req.body;

    // Basic validation
    if (!name || !category || !unit || sellingPrice === undefined) {
      return res.status(400).json({
        message: "Name, category, unit, and sellingPrice are required"
      });
    }

    if (sellingPrice < 0) {
      return res.status(400).json({
        message: "Selling price must be a positive value"
      });
    }

    const hasBatch = category === "Finished Good";

    const item = await Item.create({
      name,
      category,
      unit,
      sellingPrice,
      shelfLifeDays: hasBatch ? shelfLifeDays : 0,
      hasBatch,
      minimumLevel
    });

    res.status(201).json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// 2. GET ALL ITEMS
// =====================
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// 3. GET SINGLE ITEM
// =====================
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// 4. UPDATE ITEM
// =====================
exports.updateItem = async (req, res) => {
  try {
    const { category, sellingPrice } = req.body;

    // Validate selling price if provided
    if (sellingPrice !== undefined && sellingPrice < 0) {
      return res.status(400).json({
        message: "Selling price must be a positive value"
      });
    }

    // Handle category logic
    if (category === "Raw Material") {
      req.body.shelfLifeDays = 0;
      req.body.hasBatch = false;
    }

    if (category === "Finished Good") {
      req.body.hasBatch = true;
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// 5. DELETE ITEM
// =====================
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// GET FINISHED GOODS (FOR PRODUCTION / STOCK)
// =====================
exports.getFinishedGoods = async (req, res, next) => {
  try {
    const items = await Item.find({
      category: "Finished Good",
      status: "Active"
    }).select("name unit");

    res.json(items);

  } catch (error) {
    next(error);
  }
};

// =====================
// GET FINISHED GOODS (FOR BILLING)
// =====================
exports.getFinishedGoodsForBilling = async (req, res, next) => {
  try {
    const items = await Item.find({
      category: "Finished Good",
      status: "Active"
    }).select("name unit sellingPrice");

    res.json(items);

  } catch (error) {
    next(error);
  }
};