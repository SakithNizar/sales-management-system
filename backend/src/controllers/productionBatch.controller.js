const ProductionBatch = require("../models/productionBatch.model");
const ProductionProduct = require("../models/productionProduct.model");

/* Helper to generate batch number BY-1001, BY-1002... */
const generateBatchNo = async () => {
  const lastBatch = await ProductionBatch.findOne().sort({ createdAt: -1 });
  if (!lastBatch) return "BY-1001";
  const lastNum = parseInt(lastBatch.batchNo.split("-")[1]);
  return `BY-${lastNum + 1}`;
};

/* Helper to generate invoice number PR-001, PR-002... */
const generateInvoiceNo = async () => {
  const lastBatch = await ProductionBatch.findOne().sort({ createdAt: -1 });
  if (!lastBatch) return "PR-001";
  const lastNum = parseInt(lastBatch.invoiceNo.split("-")[1]);
  const next = (lastNum + 1).toString().padStart(3, "0");
  return `PR-${next}`;
};

/* 1️⃣ Add Production Batch */
exports.addProductionBatch = async (req, res, next) => {
  try {
    const { date, productId, quantity, unitCost, notes } = req.body;

    if (!date || !productId || !quantity || !unitCost) {
      return res.status(400).json({
        message: "date, productId, quantity and unitCost are required",
      });
    }

    const product = await ProductionProduct.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const batchNo = await generateBatchNo();
    const invoiceNo = await generateInvoiceNo();

    const totalCost = quantity * unitCost;

    const expiryDate = new Date(date);
    expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

    const productionBatch = await ProductionBatch.create({
      date,
      product: productId,
      batchNo,
      invoiceNo,
      quantity,
      unitCost,
      totalCost,
      expiryDate,
      notes,
    });

    const result = await ProductionBatch.findById(productionBatch._id)
      .populate("product", "name");

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/* 2️⃣ Get All Production Batches */
exports.getProductionBatches = async (req, res, next) => {
  try {
    const batches = await ProductionBatch.find()
      .populate("product","name")
      .sort({ createdAt: -1 });

    res.json(batches);
  } catch (error) {
    next(error);
  }
};

/* 3️⃣ Update Production Batch */
exports.updateProductionBatch = async (req, res, next) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const { date, productId, quantity, unitCost, status, notes } = req.body;

    // Recalculate expiry if product or date changes
    if (productId || date) {
      const product = productId
        ? await ProductionProduct.findById(productId)
        : await ProductionProduct.findById(batch.product);

      if (!product) return res.status(404).json({ message: "Product not found" });

      batch.product = productId || batch.product;

      const newDate = date ? new Date(date) : batch.date;
      const expiry = new Date(newDate);
      expiry.setDate(expiry.getDate() + product.shelfLifeDays);
      batch.expiryDate = expiry;
    }

    if (date) batch.date = date;
    if (quantity) batch.quantity = quantity;
    if (unitCost) batch.unitCost = unitCost;
    if (quantity || unitCost) batch.totalCost = batch.quantity * batch.unitCost;
    if (status) batch.status = status;
    if (notes) batch.notes = notes;

    await batch.save();

    const result = await ProductionBatch.findById(batch._id)
      .populate("product", "name");

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* 4️⃣ Delete Production Batch */
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