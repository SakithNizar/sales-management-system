const User = require("../models/User.model");
const Item = require("../models/item.model");
const { Expense } = require("../models/Expense.model");
const ProductionBatch = require("../models/productionBatch.model");
const Customer = require("../models/customer.model");
const Sales = require("../models/sales.model");
const StockIn = require("../models/stockIn.model");
const StockOut = require("../models/stockOut.model");

// =====================
// GET ADMIN DASHBOARD STATISTICS
// =====================
exports.getAdminStats = async (req, res, next) => {
  try {
    // 1. TOTAL USERS
    const totalUsers = await User.countDocuments({});
    
    // 2. ACTIVE ITEMS
    const activeItems = await Item.countDocuments({ status: "Active" });
    
    // 3. YEARLY EXPENSES (current year)
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    
    const endOfYear = new Date();
    endOfYear.setMonth(11, 31);
    endOfYear.setHours(23, 59, 59, 999);
    
    const yearlyExpensesResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    
    const yearlyExpenses = yearlyExpensesResult[0]?.total || 0;
    
    // 4. TOTAL PRODUCTION BATCHES
    const totalProductionBatches = await ProductionBatch.countDocuments({});
    
    // 5. TOTAL CUSTOMERS (active)
    const totalCustomers = await Customer.countDocuments({ status: "active" });
    
    // 6. TOTAL SALES THIS YEAR
    const yearlySalesResult = await Sales.aggregate([
      {
        $match: {
          invoiceDate: { $gte: startOfYear, $lte: endOfYear },
          status: "Completed"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const totalSalesThisYear = yearlySalesResult[0]?.total || 0;
    
    // 7. TOTAL STOCK VALUE (optional)
    const stockInTotal = await StockIn.aggregate([
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.totalCost" }
        }
      }
    ]);
    
    const totalStockValue = stockInTotal[0]?.total || 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeItems,
        yearlyExpenses,
        totalProductionBatches,
        totalCustomers,
        totalSalesThisYear,
        totalStockValue
      }
    });
    
  } catch (err) {
    next(err);
  }
};

// =====================
// GET MONTHLY SALES FOR CHART
// =====================
exports.getMonthlySales = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const monthlyData = await Sales.aggregate([
      {
        $match: {
          invoiceDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          },
          status: "Completed"
        }
      },
      {
        $group: {
          _id: { month: { $month: "$invoiceDate" } },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesData = months.map((month, index) => {
      const found = monthlyData.find(m => m._id.month === index + 1);
      return found ? found.total : 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        labels: months,
        values: salesData
      }
    });
    
  } catch (err) {
    next(err);
  }
};

// =====================
// GET RECENT ACTIVITIES
// =====================
exports.getRecentActivities = async (req, res, next) => {
  try {
    // Recent Users
    const recentUsers = await User.find()
      .select("fullName username role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recent Production Batches
    const recentBatches = await ProductionBatch.find()
      .populate("item", "name")
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recent Sales
    const recentSales = await Sales.find()
      .populate("customer", "customerName")
      .populate("salesman", "username")
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        recentUsers,
        recentBatches,
        recentSales
      }
    });
    
  } catch (err) {
    next(err);
  }
};