const ProductionBatch = require("../models/productionBatch.model");
const ProductionProduct = require("../models/productionProduct.model");
const mongoose = require("mongoose");

/* ----------------- 1️⃣ Daily Production Report ----------------- */
exports.getDailyReport = async (req, res, next) => {
  try {
    const dailyReport = await ProductionBatch.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
          batches: { $push: "$$ROOT" },
        },
      },
      { $sort: { "_id": -1 } },
    ]);

    // Populate product name for each batch
    for (let day of dailyReport) {
      day.batches = await ProductionBatch.populate(day.batches, {
        path: "product",
        select: "name",
      });
    }

    res.json(dailyReport);
  } catch (error) {
    next(error);
  }
};

/* ----------------- 2️⃣ Monthly Production Report ----------------- */
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const monthlyReport = await ProductionBatch.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
        },
      },
      { $sort: { "_id": -1 } },
    ]);

    res.json(monthlyReport);
  } catch (error) {
    next(error);
  }
};

/* ----------------- 3️⃣ Batch Report ----------------- */
exports.getBatchReport = async (req, res, next) => {
  try {
    const batches = await ProductionBatch.find()
      .populate("product", "name")
      .sort({ createdAt: -1 });

    const result = batches.map(batch => ({
      batchNo: batch.batchNo,
      invoiceNo: batch.invoiceNo,
      productName: batch.product.name,
      quantity: batch.quantity,
      unitCost: batch.unitCost,
      totalCost: batch.totalCost,
      expiryDate: batch.expiryDate,
      status: batch.status,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* ----------------- 4️⃣ Cost Analysis Report ----------------- */
exports.getCostAnalysis = async (req, res, next) => {
  try {
    const costAnalysis = await ProductionBatch.aggregate([
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    // Populate product name
    const result = await ProductionProduct.populate(costAnalysis, {
      path: "_id",
      select: "name",
    });

    const formatted = result.map(item => ({
      productName: item._id.name,
      totalQuantity: item.totalQuantity,
      totalCost: item.totalCost,
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/* ----------------- 5️⃣ Expiry Report ----------------- */
exports.getExpiryReport = async (req, res, next) => {
  try {
    const today = new Date();
    const expiryLimit = new Date();
    expiryLimit.setDate(today.getDate() + 7); // next 7 days

    const expiringBatches = await ProductionBatch.find({
      expiryDate: { $lte: expiryLimit, $gte: today },
    })
      .populate("product", "name")
      .sort({ expiryDate: 1 });

    const result = expiringBatches.map(batch => ({
      batchNo: batch.batchNo,
      productName: batch.product.name,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      daysLeft: Math.ceil((batch.expiryDate - today) / (1000 * 60 * 60 * 24)),
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* ----------------- 6️⃣ Dashboard Summary ----------------- */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Today production
    const todayBatches = await ProductionBatch.find({
      date: { $gte: today, $lt: tomorrow },
    });

    const todayQuantity = todayBatches.reduce((acc, b) => acc + b.quantity, 0);
    const todayCost = todayBatches.reduce((acc, b) => acc + b.totalCost, 0);

    // 2. Expiring soon
    const expiryLimit = new Date();
    expiryLimit.setDate(today.getDate() + 7);

    const expiringCount = await ProductionBatch.countDocuments({
      expiryDate: { $gte: today, $lte: expiryLimit },
    });

    // 3. Monthly summary
    const monthlySummary = await ProductionBatch.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
        },
      },
      { $sort: { "_id": -1 } },
    ]);

    res.json({
      todayQuantity,
      todayCost,
      expiringSoon: expiringCount,
      monthlySummary,
    });
  } catch (error) {
    next(error);
  }
};