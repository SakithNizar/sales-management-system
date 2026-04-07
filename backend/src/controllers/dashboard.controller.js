const StockIn = require("../models/stockIn.model");
const StockOut = require("../models/stockOut.model");

// ==============================
// GET DASHBOARD STOCK SUMMARY
// ==============================
exports.getDashboardStock = async (req, res, next) => {
  try {
    const stockIns = await StockIn.find().populate("items.item");
    const stockOuts = await StockOut.find().populate("items.item");

    const stockMap = {};

    // ======================
    // TOTAL STOCK IN
    // ======================
    stockIns.forEach((stock) => {
      stock.items.forEach((i) => {
        const id = i.item._id.toString();

        if (!stockMap[id]) {
          stockMap[id] = {
            itemId: id,
            itemName: i.item.name,
            unit: i.item.unit,
            minimumLevel: i.item.minimumLevel || 0,
            totalIn: 0,
            totalOut: 0,
          };
        }

        stockMap[id].totalIn += i.quantity;
      });
    });

    // ======================
    // TOTAL STOCK OUT
    // ======================
    stockOuts.forEach((stock) => {
      stock.items.forEach((i) => {
        const id = i.item._id.toString();

        if (!stockMap[id]) {
          stockMap[id] = {
            itemId: id,
            itemName: i.item.name,
            unit: i.item.unit,
            minimumLevel: i.item.minimumLevel || 0,
            totalIn: 0,
            totalOut: 0,
          };
        }

        stockMap[id].totalOut += i.quantity;
      });
    });

    // ======================
    // FINAL CALCULATION
    // ======================
    const result = Object.values(stockMap).map((item) => {
      const available = item.totalIn - item.totalOut;

      let status = "In Stock";
      if (available <= 0) status = "Out of Stock";
      else if (available <= item.minimumLevel) status = "Low Stock";

      return {
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        totalIn: item.totalIn,
        totalOut: item.totalOut,
        available,
        minimumLevel: item.minimumLevel,
        status,
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};