const Sales = require("../models/sales.model");
const Item = require("../models/item.model");
const Customer = require("../models/customer.model");
const User = require("../models/User.model");

// =====================
// CREATE SALES INVOICE
// =====================
exports.createSale = async (req, res, next) => {
  try {
    const { customer, items, discount = 0, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        message: "Customer and items are required"
      });
    }

    // =====================
    // VALIDATE CUSTOMER
    // =====================
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // =====================
    // ROUTE RESTRICTION (SALES MAN)
    // =====================
    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      if (!user.assignedRoutes.includes(customerDoc.route.toString())) {
        return res.status(403).json({
          message: "You can only create sales for your assigned routes"
        });
      }
    }

    // =====================
    // BUILD ITEMS + CALCULATE TOTAL
    // =====================
    let subTotal = 0;
    const formattedItems = [];

    for (const i of items) {
      const itemDoc = await Item.findById(i.item);

      if (!itemDoc) {
        return res.status(400).json({ message: "Invalid item selected" });
      }

      const price = itemDoc.sellingPrice;
      const total = price * i.quantity;

      subTotal += total;

      formattedItems.push({
        item: itemDoc._id,
        itemName: itemDoc.name,
        quantity: i.quantity,
        price,
        total
      });
    }

    const totalAmount = subTotal - discount;

    // =====================
    // AUTO INVOICE ID
    // =====================
    const last = await Sales.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;
    if (last?.invoiceId) {
      nextNumber = parseInt(last.invoiceId.split("-")[1]) + 1;
    }

    const invoiceId = `INV-${String(nextNumber).padStart(3, "0")}`;

    // =====================
    // CREATE SALES INVOICE
    // =====================
    const sale = await Sales.create({
      invoiceId,
      invoiceDate: new Date(),
      customer,
      route: customerDoc.route,
      salesman: req.user._id,
      items: formattedItems,
      subTotal,
      discount,
      totalAmount,
      status: "Completed",
      notes
    });

    // =====================
    // UPDATE CUSTOMER BALANCE (IMPORTANT FIX)
    // =====================
    customerDoc.balance += totalAmount;
    await customerDoc.save();

    res.status(201).json({
      message: "Sale created successfully",
      sale
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL SALES
// =====================
exports.getSales = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    const sales = await Sales.find(filter)
      .populate("customer", "customerName shopName")
      .populate("route", "name")
      .populate("salesman", "username")
      .sort({ createdAt: -1 });

    res.json(sales);

  } catch (err) {
    next(err);
  }
};

// =====================
// GET SINGLE SALE
// =====================
exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate("customer", "customerName shopName")
      .populate("route", "name")
      .populate("salesman", "username");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    if (
      req.user.role === "salesman" &&
      sale.salesman.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(sale);

  } catch (err) {
    next(err);
  }
};