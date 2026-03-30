const ProductionBatch = require("../models/productionBatch.model");
const Item = require("../models/item.model");

/* Generate Batch No */
const generateBatchNo = async () => {
  const lastBatch = await ProductionBatch.findOne().sort({ createdAt: -1 });
  if (!lastBatch) return "BY-1001";
  const lastNum = parseInt(lastBatch.batchNo.split("-")[1]);
  return `BY-${lastNum + 1}`;
};

/* Generate Invoice No */
const generateInvoiceNo = async () => {
  const lastBatch = await ProductionBatch.findOne().sort({ createdAt: -1 });
  if (!lastBatch) return "PR-001";
  const lastNum = parseInt(lastBatch.invoiceNo.split("-")[1]);
  const next = (lastNum + 1).toString().padStart(3, "0");
  return `PR-${next}`;
};

/* 1. Add Production Batch */
exports.addProductionBatch = async (req, res, next) => {
  try {
    const { date, itemId, quantity, unitCost, notes } = req.body;

    if (!date || !itemId || !quantity || !unitCost) {
      return res.status(400).json({
        message: "date, itemId, quantity and unitCost are required",
      });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // VALIDATION: Only Finished Goods can be produced
    if (item.category !== "Finished Good") {
      return res.status(400).json({
        message: "Only Finished Goods can be produced"
      });
    }

    const batchNo = await generateBatchNo();
    const invoiceNo = await generateInvoiceNo();

    // Calculate expiry date
    let expiryDate = null;
    if (item.shelfLifeDays > 0) {
      expiryDate = new Date(date);
      expiryDate.setDate(expiryDate.getDate() + item.shelfLifeDays);
    }

    const productionBatch = await ProductionBatch.create({
      date,
      item: itemId,
      batchNo,
      invoiceNo,
      quantity,
      unitCost,
      expiryDate,
      notes,
    });

    const result = await ProductionBatch.findById(productionBatch._id)
      .populate("item", "name category unit");

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/* 2. Get All Production Batches */
exports.getProductionBatches = async (req, res, next) => {
  try {
    const batches = await ProductionBatch.find()
      .populate("item", "name category unit")
      .sort({ createdAt: -1 });

    res.json(batches);
  } catch (error) {
    next(error);
  }
};

/* 3. Get Single Batch */
exports.getProductionBatch = async (req, res, next) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id)
      .populate("item", "name category unit");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json(batch);
  } catch (error) {
    next(error);
  }
};

/* 4. Update Production Batch */
exports.updateProductionBatch = async (req, res, next) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const { date, itemId, quantity, unitCost, status, notes } = req.body;

    // If item changed
    if (itemId) {
      const item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      if (item.category !== "Finished Good") {
        return res.status(400).json({
          message: "Only Finished Goods can be produced"
        });
      }

      batch.item = itemId;

      if (item.shelfLifeDays > 0) {
        const newDate = date ? new Date(date) : batch.date;
        const expiry = new Date(newDate);
        expiry.setDate(expiry.getDate() + item.shelfLifeDays);
        batch.expiryDate = expiry;
      }
    }

    if (date) batch.date = date;
    if (quantity) batch.quantity = quantity;
    if (unitCost) batch.unitCost = unitCost;

    // Recalculate total cost
    if (quantity || unitCost) {
      batch.totalCost = batch.quantity * batch.unitCost;
    }

    if (status) batch.status = status;
    if (notes) batch.notes = notes;

    await batch.save();

    const result = await ProductionBatch.findById(batch._id)
      .populate("item", "name category unit");

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* 5. Delete Production Batch */
exports.deleteProductionBatch = async (req, res, next) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    await ProductionBatch.findByIdAndDelete(req.params.id);

    res.json({ message: "Production batch deleted successfully" });
  } catch (error) {
    next(error);
  }
};