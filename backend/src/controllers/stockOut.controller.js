const StockOut = require("../models/stockOut.model");
const Item = require("../models/item.model");
const StockIn = require("../models/stockIn.model");

// Generate Stock OUT invoice number
const generateStockOutInvoiceNo = async () => {
  const last = await StockOut.findOne().sort({ createdAt: -1 });
  const lastNumber = last ? parseInt(last.invoiceNo.split("-")[2]) : 0;
  return `ST-OUT-${String(lastNumber + 1).padStart(3, "0")}`;
};

// --- Create Stock OUT ---
const createStockOut = async (req, res, next) => {
  try {
    const { date, items } = req.body;
    const manager = req.user?.fullName;

    if (!manager) return res.status(401).json({ message: "Unauthorized: Manager not found" });
    if (!date || !items || items.length === 0)
      return res.status(400).json({ message: "Date and items are required" });

    const invoiceNo = await generateStockOutInvoiceNo();
    let processedItems = [];

    for (const i of items) {
      const itemData = await Item.findById(i.item);
      if (!itemData) return res.status(404).json({ message: "Item not found" });

      let remainingQty = i.quantity;

      if (itemData.category === "Finished Good") {
        const batches = await StockIn.find({ "items.item": i.item }).sort({ date: 1 });
        for (const batch of batches) {
          const batchItem = batch.items.find(b => b.item.toString() === i.item && b.quantity > 0);
          if (!batchItem) continue;

          const deductQty = Math.min(remainingQty, batchItem.quantity);
          batchItem.quantity -= deductQty;
          remainingQty -= deductQty;

          processedItems.push({
            item: i.item,
            batchNo: batchItem.batchNo,
            quantity: deductQty,
            unitCost: batchItem.unitCost,
            totalCost: deductQty * batchItem.unitCost,
            expiryDate: batchItem.expiryDate
          });

          await batch.save();
          if (remainingQty <= 0) break;
        }
        if (remainingQty > 0)
          return res.status(400).json({ message: `Insufficient stock for ${itemData.name}` });

      } else if (itemData.category === "Raw Material") {
        const stockIns = await StockIn.find({ "items.item": i.item });
        let totalAvailable = stockIns.reduce((sum, s) => {
          const itm = s.items.find(itm => itm.item.toString() === i.item);
          return sum + (itm ? itm.quantity : 0);
        }, 0);

        if (remainingQty > totalAvailable)
          return res.status(400).json({ message: `Insufficient stock for ${itemData.name}` });

        for (const s of stockIns) {
          const itm = s.items.find(itm => itm.item.toString() === i.item && itm.quantity > 0);
          if (!itm) continue;

          const deductQty = Math.min(remainingQty, itm.quantity);
          itm.quantity -= deductQty;
          remainingQty -= deductQty;

          processedItems.push({
            item: i.item,
            batchNo: null,
            quantity: deductQty,
            unitCost: itm.unitCost,
            totalCost: deductQty * itm.unitCost,
            expiryDate: itm.expiryDate || null
          });

          await s.save();
          if (remainingQty <= 0) break;
        }
      }
    }

    const stockOut = await StockOut.create({
      date,
      invoiceNo,
      manager,
      items: processedItems
    });

    await stockOut.populate("items.item");
    res.status(201).json({ message: "Stock OUT recorded successfully", stockOut });
  } catch (err) {
    next(err);
  }
};

// --- Get all Stock OUT ---
const getStockOuts = async (req, res, next) => {
  try {
    const stockOuts = await StockOut.find().populate("items.item").sort({ createdAt: -1 });
    const formatted = stockOuts.flatMap(so =>
      so.items.map(itm => ({
        date: so.date.toISOString().split("T")[0],
        invoiceNo: so.invoiceNo,
        itemName: itm.item.name,
        quantity: itm.quantity,
        unit: itm.item.unit,
        store: itm.item.category === "Finished Good" ? "Production" : "Raw Material",
        manager: so.manager,
        remarks: itm.batchNo || "",
        expiryDate: itm.expiryDate ? itm.expiryDate.toISOString().split("T")[0] : null,
        stockOutId: so._id
      }))
    );
    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

// --- Get single Stock OUT by ID ---
const getStockOutById = async (req, res, next) => {
  try {
    const stockOut = await StockOut.findById(req.params.id).populate("items.item");
    if (!stockOut) return res.status(404).json({ message: "Stock OUT not found" });
    res.status(200).json(stockOut);
  } catch (err) {
    next(err);
  }
};

// --- Update Stock OUT ---
const updateStockOut = async (req, res, next) => {
  try {
    const { date, items } = req.body;
    const stockOut = await StockOut.findById(req.params.id);
    if (!stockOut) return res.status(404).json({ message: "Stock OUT not found" });

    if (date) stockOut.date = date;
    if (items && items.length > 0) stockOut.items = items;

    await stockOut.save();
    res.status(200).json({ message: "Stock OUT updated successfully", stockOut });
  } catch (err) {
    next(err);
  }
};

// --- Delete Stock OUT ---
const deleteStockOut = async (req, res, next) => {
  try {
    const stockOut = await StockOut.findById(req.params.id);
    if (!stockOut) return res.status(404).json({ message: "Stock OUT not found" });

    await stockOut.deleteOne();
    res.status(200).json({ message: "Stock OUT deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Export all functions
module.exports = {
  createStockOut,
  getStockOuts,
  getStockOutById,
  updateStockOut,
  deleteStockOut
};