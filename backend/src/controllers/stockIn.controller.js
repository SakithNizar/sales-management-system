const StockIn = require("../models/stockIn.model");
const Item = require("../models/item.model");
const ProductionBatch = require("../models/productionBatch.model");

// Generate next invoice number
const generateInvoiceNo = async () => {
  const lastStockIn = await StockIn.findOne().sort({ createdAt: -1 });

  let lastNumber = 0;
  if (lastStockIn && lastStockIn.invoiceNo) {
    const parts = lastStockIn.invoiceNo.split("-");
    lastNumber = parseInt(parts[2]) || 0;
  }

  return `ST-IN-${String(lastNumber + 1).padStart(3, "0")}`;
};

// ==============================
// CREATE STOCK IN
// ==============================
exports.createStockIn = async (req, res, next) => {
  try {
    const { date, source, items } = req.body;

    const manager = req.user?.fullName;
    if (!manager) {
      return res.status(401).json({ message: "Unauthorized: Manager not found" });
    }

    if (!date || !source || !items || items.length === 0) {
      return res.status(400).json({
        message: "Date, source, and items are required",
      });
    }

    if (!["Production", "Purchase"].includes(source)) {
      return res.status(400).json({
        message: "Source must be Production or Purchase",
      });
    }

    const invoiceNo = await generateInvoiceNo();
    let processedItems = [];

    for (const i of items) {
      const itemData = await Item.findById(i.item);
      if (!itemData) {
        return res.status(404).json({ message: "Item not found" });
      }

      let quantity = i.quantity;
      let unitCost = i.unitCost;
      let expiryDate = i.expiryDate;
      let batchNo = i.batchNo;

      if (source === "Production") {
        if (!batchNo) {
          return res.status(400).json({
            message: `Batch number required for ${itemData.name}`,
          });
        }

        const batch = await ProductionBatch.findOne({
          batchNo: batchNo,
          item: i.item,
        });

        if (!batch) {
          return res.status(404).json({
            message: `Batch ${batchNo} not found`,
          });
        }

        unitCost = batch.unitCost;
        expiryDate = batch.expiryDate;
        if (!quantity) quantity = batch.quantity;
      }

      if (source === "Purchase") {
        if (!quantity || !unitCost) {
          return res.status(400).json({
            message: `Quantity and Unit Cost required for ${itemData.name}`,
          });
        }
      }

      const totalCost = quantity * unitCost;

      processedItems.push({
        item: i.item,
        batchNo,
        quantity,
        unitCost,
        totalCost,
        expiryDate,
      });
    }

    const stockIn = await StockIn.create({
      date,
      invoiceNo,
      source,
      manager,
      items: processedItems,
    });

    res.status(201).json({
      message: "Stock IN recorded successfully",
      stockIn,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// GET TABLE LIST (FORMATTED)
// ==============================
exports.getStockIns = async (req, res, next) => {
  try {
    const stockIns = await StockIn.find()
      .populate("items.item")
      .sort({ createdAt: -1 });

    const formatted = stockIns
      .map((stock) =>
        stock.items.map((i) => ({
          date: stock.date,
          invoiceNo: stock.invoiceNo,
          itemName: i.item.name,
          quantity: i.quantity,
          unit: i.item.unit,
          unitCost: i.unitCost,       // ✅ added
          totalCost: i.totalCost,     // ✅ added
          store: stock.source,
          manager: stock.manager,
          remarks: i.batchNo || "Purchase",
          expiryDate: i.expiryDate,
          stockInId: stock._id,
        }))
      )
      .flat();

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// ==============================
// GET SINGLE INVOICE (FULL)
// ==============================
exports.getStockInById = async (req, res, next) => {
  try {
    const stockIn = await StockIn.findById(req.params.id)
      .populate("items.item");

    if (!stockIn) {
      return res.status(404).json({ message: "Stock IN not found" });
    }

    res.status(200).json(stockIn);
  } catch (error) {
    next(error);
  }
};

// ==============================
// UPDATE STOCK IN
// ==============================
exports.updateStockIn = async (req, res, next) => {
  try {
    const { date, source, items } = req.body;

    const stockIn = await StockIn.findById(req.params.id);
    if (!stockIn) {
      return res.status(404).json({ message: "Stock IN not found" });
    }

    let processedItems = [];

    for (const i of items) {
      const itemData = await Item.findById(i.item);
      if (!itemData) {
        return res.status(404).json({ message: "Item not found" });
      }

      const totalCost = i.quantity * i.unitCost;

      processedItems.push({
        item: i.item,
        batchNo: i.batchNo,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalCost,
        expiryDate: i.expiryDate,
      });
    }

    stockIn.date = date || stockIn.date;
    stockIn.source = source || stockIn.source;
    stockIn.items = processedItems;

    await stockIn.save();

    res.status(200).json({
      message: "Stock IN updated successfully",
      stockIn,
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// DELETE STOCK IN
// ==============================
exports.deleteStockIn = async (req, res, next) => {
  try {
    const stockIn = await StockIn.findById(req.params.id);
    if (!stockIn) {
      return res.status(404).json({ message: "Stock IN not found" });
    }

    await stockIn.deleteOne();

    res.status(200).json({
      message: "Stock IN deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};