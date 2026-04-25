const Payment = require("../models/payment.model");
const Sales = require("../models/sales.model");
const Customer = require("../models/customer.model");
const User = require("../models/User.model");

// =====================
// CREATE PAYMENT
// =====================
exports.createPayment = async (req, res, next) => {
  try {
    const { customer, invoice, amount, paymentMethod, notes } = req.body;

    if (!customer || !invoice || !amount) {
      return res.status(400).json({ message: "Customer, invoice, and amount are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const sale = await Sales.findById(invoice);
    if (!sale) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Salesman restriction
    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);
      if (!user.assignedRoutes.includes(sale.route.toString())) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Prevent overpayment
    if (amount > sale.dueAmount) {
      return res.status(400).json({ message: "Amount exceeds due amount" });
    }

    // =====================
    // UPDATE INVOICE
    // =====================
    sale.paidAmount += amount;
    sale.dueAmount = sale.totalAmount - sale.paidAmount;

    if (sale.dueAmount === 0) sale.paymentStatus = "Paid";
    else if (sale.paidAmount > 0) sale.paymentStatus = "Partial";

    await sale.save();

    // =====================
    // UPDATE CUSTOMER BALANCE
    // =====================
    customerDoc.balance -= amount;
    await customerDoc.save();

    // =====================
    // AUTO RECEIPT ID
    // =====================
    const last = await Payment.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;
    if (last?.receiptId) {
      nextNumber = parseInt(last.receiptId.split("-")[1]) + 1;
    }

    const receiptId = `REC-${String(nextNumber).padStart(3, "0")}`;

    const payment = await Payment.create({
      receiptId,
      customer,
      invoice,
      route: sale.route,
      salesman: req.user._id,
      amount,
      paymentMethod,
      notes
    });

    res.status(201).json({
      message: "Payment recorded successfully",
      payment
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET ALL PAYMENTS (HISTORY)
// =====================
exports.getPayments = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    if (req.query.invoice) {
      filter.invoice = req.query.invoice;
    }

    const payments = await Payment.find(filter)
      .populate("customer", "customerName shopName")
      .populate("invoice", "invoiceId totalAmount dueAmount")
      .populate("salesman", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);

  } catch (err) {
    next(err);
  }
};

// =====================
// GET SINGLE PAYMENT
// =====================
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("customer", "customerName shopName")
      .populate("invoice", "invoiceId totalAmount paidAmount dueAmount")
      .populate("salesman", "username");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Salesman restriction
    if (req.user.role === "salesman" && payment.salesman._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(payment);

  } catch (err) {
    next(err);
  }
};

// =====================
// UPDATE PAYMENT (RARE CASE)
// =====================
exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const { amount, paymentMethod, notes } = req.body;

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amount !== undefined) payment.amount = amount;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (notes) payment.notes = notes;

    await payment.save();

    res.status(200).json({
      message: "Payment updated successfully",
      payment
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE PAYMENT (VERY SENSITIVE)
// =====================
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Reverse effects
    const sale = await Sales.findById(payment.invoice);
    const customer = await Customer.findById(payment.customer);

    if (sale) {
      sale.paidAmount -= payment.amount;
      sale.dueAmount += payment.amount;

      if (sale.paidAmount === 0) sale.paymentStatus = "Unpaid";
      else sale.paymentStatus = "Partial";

      await sale.save();
    }

    if (customer) {
      customer.balance += payment.amount;
      await customer.save();
    }

    await payment.deleteOne();

    res.status(200).json({ message: "Payment deleted and reversed successfully" });

  } catch (err) {
    next(err);
  }
};