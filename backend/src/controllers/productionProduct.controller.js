const ProductionProduct = require("../models/productionProduct.model");

// create product
exports.createProductionProduct = async (req, res) => {
  try {

    const { name, shelfLifeDays } = req.body;

    const product = await ProductionProduct.create({
      name,
      shelfLifeDays
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// get all products
exports.getProductionProducts = async (req, res) => {
  try {

    const products = await ProductionProduct.find();

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// update product
exports.updateProductionProduct = async (req, res) => {

  try {

    const product = await ProductionProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// delete product
exports.deleteProductionProduct = async (req, res) => {

  try {

    await ProductionProduct.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};