const Item = require("../models/item.model");

/* 1. Create Item */
exports.createItem = async (req, res) => {
  try {
    const { name, category, unit, shelfLifeDays, minimumLevel } = req.body;

    const hasBatch = category === "Finished Good";

    const item = await Item.create({
      name,
      category,
      unit,
      shelfLifeDays: hasBatch ? shelfLifeDays : 0,
      hasBatch,
      minimumLevel
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* 2. Get All Items */
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* 3. Get Single Item */
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* 4. Update Item */
exports.updateItem = async (req, res) => {
  try {
    const { category, shelfLifeDays } = req.body;

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
      { new: true }
    );

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* 5. Delete Item */
exports.deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* Get Finished Goods for Dropdown */
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