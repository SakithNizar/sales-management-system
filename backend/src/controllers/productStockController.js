const ProductStock = require('../models/ProductStock.model');
const Product = require('../models/Product.model');

// Add New Stock Batch
exports.addStockBatch = async (req, res) => {
  try {
    const { productId, batchNumber, quantity, expiryDate, supplierName } = req.body;

    // Validation
    if (!productId || !batchNumber || !quantity || !expiryDate) {
      return res.status(400).json({
        message: "Product, batch number, quantity and expiry date are required"
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check if same batch already exists for this product
    const existingBatch = await ProductStock.findOne({
      product: productId,
      batchNumber: batchNumber
    });

    if (existingBatch) {
      return res.status(400).json({
        message: "This batch number already exists for this product"
      });
    }

    // Create new stock batch
    const newStock = new ProductStock({
      product: productId,
      batchNumber,
      quantity,
      expiryDate,
      supplierName
    });

    const savedStock = await newStock.save();

    res.status(201).json({
      message: "Stock batch added successfully",
      stock: savedStock
    });

  } catch (error) {
    console.error("Add Stock Error:", error);

    res.status(500).json({
      message: "Error while adding stock batch",
      error: error.message
    });
  }
};

// Update existing stock batch
exports.updateStockBatch = async (req, res) => {
  try {
    const stockId = req.params.id;
    const { quantity, expiryDate, supplierName, batchNumber, status } = req.body;

    const stock = await ProductStock.findById(stockId);

    if (!stock) {
      return res.status(404).json({
        message: "Stock batch not found"
      });
    }

    // Update allowed fields only if provided
    if (quantity !== undefined) {
      stock.quantity = quantity;
    }

    if (expiryDate) {
      stock.expiryDate = expiryDate;
    }

    if (supplierName) {
      stock.supplierName = supplierName;
    }

    if (batchNumber) {
      stock.batchNumber = batchNumber;
    }

    if (status) {
      stock.status = status;
    }

    const updatedStock = await stock.save();

    res.status(200).json({
      message: "Stock batch updated successfully",
      stock: updatedStock
    });

  } catch (error) {
    console.error("Update Stock Error:", error);

    res.status(500).json({
      message: "Error updating stock batch",
      error: error.message
    });
  }
};

// Get total stock summary of a product
exports.getStockSummaryByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Check if any stock records exist for this product
    const stocks = await ProductStock.find({ product: productId });

    if (!stocks || stocks.length === 0) {
      return res.status(404).json({
        message: "No stock records found for this product"
      });
    }

    const today = new Date();

    let totalQuantity = 0;
    let expiredQuantity = 0;
    let nearExpiryQuantity = 0;

    const batchDetails = [];

    stocks.forEach(stock => {
      const expiry = new Date(stock.expiryDate);

      // Calculate total quantity
      totalQuantity += stock.quantity;

      // Check expired
      if (expiry < today) {
        expiredQuantity += stock.quantity;
      }

      // Check near expiry (within 15 days)
      const diffDays = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0 && diffDays <= 15) {
        nearExpiryQuantity += stock.quantity;
      }

      batchDetails.push({
        batchNumber: stock.batchNumber,
        quantity: stock.quantity,
        expiryDate: stock.expiryDate,
        status: stock.status
      });
    });

    res.status(200).json({
      productId,
      totalQuantity,
      expiredQuantity,
      nearExpiryQuantity,
      availableForSale: totalQuantity - expiredQuantity,
      batches: batchDetails
    });

  } catch (error) {
    console.error("Get Stock Summary Error:", error);

    res.status(500).json({
      message: "Error fetching stock summary",
      error: error.message
    });
  }
};
