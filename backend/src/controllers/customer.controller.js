const Customer = require("../models/customer.model");
const Route = require("../models/route.model");
const User = require("../models/User.model");
const Sales = require("../models/sales.model");
const Payment = require("../models/payment.model");


// =====================
// CREATE CUSTOMER (WITH AUTO CUSTOMER ID)
// =====================
exports.createCustomer = async (req, res, next) => {
  try {
    const {
      customerName,
      shopName,
      phoneNumber,
      address,
      route
    } = req.body;

    // =====================
    // Validation
    // =====================
    if (!customerName || !shopName || !phoneNumber || !address || !route) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const routeExists = await Route.findById(route);
    if (!routeExists) {
      return res.status(400).json({ message: "Invalid route" });
    }

    // =====================
    // Salesman restriction
    // =====================
    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      const allowed = user.assignedRoutes
        .map(r => r.toString())
        .includes(route);

      if (!allowed) {
        return res.status(403).json({
          message: "You can only create customers in your assigned routes"
        });
      }
    }

    // =====================
    // AUTO CUSTOMER ID GENERATION
    // =====================
    const last = await Customer.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (last?.customerId) {
      nextNumber = parseInt(last.customerId.split("-")[1]) + 1;
    }

    const customerId = `CUS-${String(nextNumber).padStart(3, "0")}`;

    // =====================
    // CREATE CUSTOMER
    // =====================
    const customer = await Customer.create({
      customerId,
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: "Customer created successfully",
      customer
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL CUSTOMERS
// =====================
exports.getCustomers = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === "admin") {
      if (req.query.route) {
        filter.route = req.query.route;
      }
    }

    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      filter.route = {
        $in: user.assignedRoutes
      };
    }

    const customers = await Customer.find(filter)
      .populate("route", "name city")
      .populate("createdBy", "username role");

    res.status(200).json(customers);

  } catch (err) {
    next(err);
  }
};

// =====================
// GET SINGLE CUSTOMER
// =====================
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("route", "name city")
      .populate("createdBy", "username role");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      const allowed = user.assignedRoutes
        .map(r => r.toString())
        .includes(customer.route._id.toString());

      if (!allowed) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.status(200).json(customer);

  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE CUSTOMER
// =====================
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      const allowed = user.assignedRoutes
        .map(r => r.toString())
        .includes(customer.route.toString());

      if (!allowed) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const {
      customerName,
      shopName,
      phoneNumber,
      address,
      route,
      creditLimit,
      status,
      notes,
      email,
      whatsapp,
      location
    } = req.body;

    // route update validation
    if (route && route !== customer.route.toString()) {
      const routeExists = await Route.findById(route);
      if (!routeExists) {
        return res.status(400).json({ message: "Invalid route" });
      }

      if (req.user.role === "salesman") {
        const user = await User.findById(req.user._id);

        const allowed = user.assignedRoutes
          .map(r => r.toString())
          .includes(route);

        if (!allowed) {
          return res.status(403).json({
            message: "You cannot assign to this route"
          });
        }
      }

      customer.route = route;
    }

    // updates
    if (customerName) customer.customerName = customerName;
    if (shopName) customer.shopName = shopName;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (address) customer.address = address;
    if (creditLimit !== undefined) customer.creditLimit = creditLimit;
    if (status) customer.status = status;
    if (notes) customer.notes = notes;
    if (email) customer.email = email;
    if (whatsapp) customer.whatsapp = whatsapp;
    if (location) customer.location = location;

    await customer.save();

    res.status(200).json({
      message: "Customer updated successfully",
      customer
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE CUSTOMER
// =====================
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);

      const allowed = user.assignedRoutes
        .map(r => r.toString())
        .includes(customer.route.toString());

      if (!allowed) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    await customer.deleteOne();

    res.status(200).json({
      message: "Customer deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET CUSTOMER LEDGER
// =====================
exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // =====================
    // GET SALES
    // =====================
    const sales = await Sales.find({ customer: id }).select(
      "invoiceId totalAmount createdAt"
    );

    // =====================
    // GET PAYMENTS
    // =====================
    const payments = await Payment.find({ customer: id }).select(
      "receiptId amount createdAt"
    );

    // =====================
    // FORMAT LEDGER ENTRIES
    // =====================
    const saleEntries = sales.map((s) => ({
      date: s.createdAt,
      type: "Sale",
      reference: s.invoiceId,
      amount: s.totalAmount,
      rawAmount: s.totalAmount // for calculation
    }));

    const paymentEntries = payments.map((p) => ({
      date: p.createdAt,
      type: "Payment",
      reference: p.receiptId,
      amount: -p.amount,
      rawAmount: -p.amount
    }));

    // =====================
    // MERGE + SORT
    // =====================
    const ledger = [...saleEntries, ...paymentEntries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // =====================
    // RUNNING BALANCE
    // =====================
    let balance = 0;

    const finalLedger = ledger.map((entry) => {
      balance += entry.rawAmount;

      return {
        date: entry.date,
        type: entry.type,
        reference: entry.reference,
        amount: entry.amount,
        balance
      };
    });

    res.status(200).json({
      customer: {
        id: customer._id,
        name: customer.customerName,
        shopName: customer.shopName
      },
      ledger: finalLedger,
      currentBalance: balance
    });

  } catch (err) {
    next(err);
  }
};