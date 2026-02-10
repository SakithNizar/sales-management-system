const Product = require('../models/Product.model');

// Add New Product
exports.addProduct = async (req, res) => {
  try {
    const { productName, category, price, description } = req.body;

    // Basic Validation
    if (!productName || !category || !price) {
      return res.status(400).json({
        message: "Product name, category and price are required"
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ productName });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product with this name already exists"
      });
    }

    // Create new product
    const newProduct = new Product({
      productName,
      category,
      price,
      description,
      createdBy: req.user?.id   // from auth middleware
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Product added successfully",
      product: savedProduct
    });

  } catch (error) {
    console.error("Add Product Error:", error);

    res.status(500).json({
      message: "Server error while adding product",
      error: error.message
    });
  }
};

// Update existing product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Update fields
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};
