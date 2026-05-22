// controllers/paymentController.js
const Payment = require("../models/payment.model");
const Sales = require("../models/sales.model");
const Customer = require("../models/customer.model");
const User = require("../models/User.model");
const { addTransaction } = require("../services/accountService");

// =====================
// CREATE PAYMENT
// =====================
exports.createPayment = async (req, res, next) => {
  try {
    const { customer, invoice, amount, paymentMethod, referenceNo, paymentDate, notes } = req.body;

    console.log("Payment request received:", { customer, invoice, amount, paymentMethod });

    // Validation
    if (!customer || !invoice || !amount) {
      return res.status(400).json({ 
        success: false,
        message: "Customer, invoice, and amount are required" 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Amount must be greater than 0" 
      });
    }

    // Get sale/invoice
    const sale = await Sales.findById(invoice);
    if (!sale) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }

    console.log("Sale found:", { 
      invoiceId: sale.invoiceId, 
      totalAmount: sale.totalAmount, 
      paidAmount: sale.paidAmount || 0,
      dueAmount: sale.dueAmount || sale.totalAmount
    });

    // Calculate current due amount
    const currentDue = sale.dueAmount || (sale.totalAmount - (sale.paidAmount || 0));
    
    if (amount > currentDue) {
      return res.status(400).json({ 
        success: false,
        message: `Amount cannot exceed due amount. Due: ${currentDue}, Attempted: ${amount}` 
      });
    }

    // Get customer
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Check if payment method is valid
    const validPaymentMethods = ["Cash", "Bank", "Online", "Cheque"];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}`
      });
    }

    // Salesman restriction
    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);
      if (!user.assignedRoutes || !user.assignedRoutes.includes(sale.route.toString())) {
        return res.status(403).json({ 
          success: false,
          message: "Access denied - You can only collect payments for your assigned routes" 
        });
      }
    }

    // =====================
    // UPDATE INVOICE (WITHOUT relying on middleware)
    // =====================
    const oldPaidAmount = sale.paidAmount || 0;
    sale.paidAmount = oldPaidAmount + amount;
    sale.dueAmount = sale.totalAmount - sale.paidAmount;

    if (sale.dueAmount === 0) {
      sale.paymentStatus = "Paid";
    } else if (sale.paidAmount > 0) {
      sale.paymentStatus = "Partial";
    } else {
      sale.paymentStatus = "Unpaid";
    }

    // Save the sale - this will work without middleware
    await sale.save();
    console.log("Sale updated:", { 
      paidAmount: sale.paidAmount, 
      dueAmount: sale.dueAmount, 
      paymentStatus: sale.paymentStatus 
    });

    // =====================
    // UPDATE CUSTOMER BALANCE
    // =====================
    customerDoc.balance = (customerDoc.balance || 0) - amount;
    await customerDoc.save();
    console.log("Customer balance updated:", customerDoc.balance);

    // =====================
    // GENERATE RECEIPT ID
    // =====================
    const last = await Payment.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (last?.receiptId) {
      const match = last.receiptId.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    const receiptId = `REC-${String(nextNumber).padStart(3, "0")}`;
    console.log("Generated receipt ID:", receiptId);

    // =====================
    // CREATE PAYMENT RECORD
    // =====================
    const payment = await Payment.create({
      receiptId,
      customer,
      invoice,
      route: sale.route,
      salesman: req.user._id,
      amount,
      paymentMethod: paymentMethod || "Cash",
      referenceNo: referenceNo || null,
      paymentDate: paymentDate || new Date(),
      notes: notes || "",
      isReversed: false
    });

    console.log("Payment created:", payment._id);

    // =====================
    // RECORD IN ACCOUNTS
    // =====================
    try {
      await addTransaction({
        date: paymentDate || new Date(),
        invoiceNo: receiptId,
        description: `Payment Received - ${customerDoc.customerName} - Invoice ${sale.invoiceId}`,
        income: amount,
        expense: 0,
        sourceModule: "payment",
        sourceId: payment._id,
        enteredBy: req.user._id,
        notes: notes || `Payment for invoice ${sale.invoiceId}`
      });
      console.log("✅ Payment transaction added to accounts");
    } catch (accountErr) {
      console.error("Failed to record account transaction:", accountErr.message);
      // Don't fail the request - payment is still recorded
    }

    // Populate response
    const populatedPayment = await Payment.findById(payment._id)
      .populate("customer", "customerName shopName")
      .populate("invoice", "invoiceId totalAmount paidAmount dueAmount paymentStatus")
      .populate("salesman", "username fullName");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment: populatedPayment
    });

  } catch (err) {
    console.error("Error in createPayment:", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Internal server error"
    });
  }
};

// =====================
// GET ALL PAYMENTS (HISTORY)
// =====================
exports.getPayments = async (req, res, next) => {
  try {
    let filter = { isReversed: { $ne: true } };

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    if (req.query.invoice) {
      filter.invoice = req.query.invoice;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.paymentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate("customer", "customerName shopName phoneNumber")
      .populate("invoice", "invoiceId totalAmount paidAmount dueAmount paymentStatus")
      .populate("salesman", "username fullName")
      .sort({ createdAt: -1 });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Group by payment method
    const methodBreakdown = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'Cash';
      methodBreakdown[method] = (methodBreakdown[method] || 0) + p.amount;
    });

    res.status(200).json({
      success: true,
      summary: {
        totalPayments,
        totalAmount,
        methodBreakdown
      },
      payments
    });
  } catch (err) {
    console.error("Error in getPayments:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// GET PAYMENTS BY CUSTOMER
// =====================
exports.getPaymentsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const payments = await Payment.find({ customer: customerId, isReversed: { $ne: true } })
      .populate("invoice", "invoiceId totalAmount dueAmount paymentStatus")
      .populate("salesman", "username fullName")
      .sort({ createdAt: -1 });

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalPayments: payments.length,
        totalAmount
      },
      payments
    });
  } catch (err) {
    console.error("Error in getPaymentsByCustomer:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// GET PAYMENTS BY INVOICE
// =====================
exports.getPaymentsByInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const payments = await Payment.find({ invoice: invoiceId, isReversed: { $ne: true } })
      .populate("customer", "customerName shopName")
      .populate("salesman", "username fullName")
      .sort({ createdAt: -1 });

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalPayments: payments.length,
        totalAmount
      },
      payments
    });
  } catch (err) {
    console.error("Error in getPaymentsByInvoice:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// GET SINGLE PAYMENT
// =====================
exports.getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate("customer", "customerName shopName phoneNumber email")
      .populate("invoice", "invoiceId invoiceDate totalAmount paidAmount dueAmount paymentStatus")
      .populate("salesman", "username fullName");

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    // Salesman restriction
    if (req.user.role === "salesman" && payment.salesman?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (err) {
    console.error("Error in getPayment:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// UPDATE PAYMENT
// =====================
exports.updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, referenceNo, notes } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    if (payment.isReversed) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a reversed payment"
      });
    }

    const oldAmount = payment.amount;
    const amountChanged = amount !== undefined && amount !== oldAmount;

    if (amountChanged) {
      if (amount <= 0) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid amount" 
        });
      }
      
      // Need to adjust the sale's paid amount
      const sale = await Sales.findById(payment.invoice);
      if (sale) {
        const amountDifference = amount - oldAmount;
        const newPaidAmount = (sale.paidAmount || 0) + amountDifference;
        
        if (newPaidAmount > sale.totalAmount) {
          return res.status(400).json({
            success: false,
            message: "Updated payment would exceed invoice total"
          });
        }
        
        sale.paidAmount = newPaidAmount;
        sale.dueAmount = sale.totalAmount - newPaidAmount;
        
        if (sale.dueAmount === 0) {
          sale.paymentStatus = "Paid";
        } else if (newPaidAmount > 0) {
          sale.paymentStatus = "Partial";
        } else {
          sale.paymentStatus = "Unpaid";
        }
        
        await sale.save();
        
        // Also update customer balance
        const customer = await Customer.findById(payment.customer);
        if (customer) {
          customer.balance = (customer.balance || 0) - amountDifference;
          await customer.save();
        }
      }
      
      payment.amount = amount;
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (referenceNo !== undefined) payment.referenceNo = referenceNo;
    if (notes) payment.notes = notes;

    await payment.save();

    // Update account transaction if amount changed
    if (amountChanged) {
      try {
        const Account = require("../models/Account.model");
        await Account.findOneAndUpdate(
          { sourceModule: "payment", sourceId: payment._id },
          { 
            income: amount,
            notes: notes || `Payment updated - ${payment.receiptId}`
          }
        );
        console.log(`✅ Payment account transaction updated: ${payment.receiptId}`);
      } catch (accountErr) {
        console.error("Failed to update account transaction:", accountErr);
      }
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate("customer", "customerName shopName")
      .populate("invoice", "invoiceId totalAmount paidAmount dueAmount");

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment: populatedPayment
    });
  } catch (err) {
    console.error("Error in updatePayment:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// DELETE PAYMENT (REVERSE)
// =====================
exports.deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    if (payment.isReversed) {
      return res.status(400).json({
        success: false,
        message: "Payment already reversed"
      });
    }

    // Mark as reversed
    payment.isReversed = true;
    payment.reversedAt = new Date();
    payment.reversedBy = req.user._id;
    await payment.save();

    // Delete account transaction
    try {
      const Account = require("../models/Account.model");
      await Account.deleteOne({ 
        sourceModule: "payment", 
        sourceId: payment._id 
      });
      console.log(`✅ Payment account transaction deleted: ${payment.receiptId}`);
    } catch (err) {
      console.warn("Could not delete account transaction:", err.message);
    }

    // Reverse effects on sale (WITHOUT relying on middleware)
    const sale = await Sales.findById(payment.invoice);
    if (sale) {
      sale.paidAmount = Math.max(0, (sale.paidAmount || 0) - payment.amount);
      sale.dueAmount = sale.totalAmount - sale.paidAmount;

      if (sale.dueAmount === sale.totalAmount) {
        sale.paymentStatus = "Unpaid";
      } else if (sale.paidAmount > 0) {
        sale.paymentStatus = "Partial";
      } else {
        sale.paymentStatus = "Unpaid";
      }

      await sale.save();
      console.log(`✅ Sale updated after payment reversal: ${sale.invoiceId}`);
    }

    // Reverse effects on customer
    const customer = await Customer.findById(payment.customer);
    if (customer) {
      customer.balance = (customer.balance || 0) + payment.amount;
      await customer.save();
      console.log(`✅ Customer balance updated after payment reversal: ${customer.customerName}`);
    }

    res.status(200).json({ 
      success: true,
      message: "Payment reversed successfully",
      payment: {
        _id: payment._id,
        receiptId: payment.receiptId,
        isReversed: payment.isReversed,
        reversedAt: payment.reversedAt
      }
    });
  } catch (err) {
    console.error("Error in deletePayment:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// REVERSE PAYMENT (Alternative endpoint with reason)
// =====================
exports.reversePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    if (payment.isReversed) {
      return res.status(400).json({
        success: false,
        message: "Payment already reversed"
      });
    }

    // Mark as reversed
    payment.isReversed = true;
    payment.reversedAt = new Date();
    payment.reversedBy = req.user._id;
    payment.notes = payment.notes 
      ? `${payment.notes} | Reversed: ${reason || 'No reason provided'}` 
      : `Reversed: ${reason || 'No reason provided'}`;
    await payment.save();

    // Delete account transaction
    try {
      const Account = require("../models/Account.model");
      await Account.deleteOne({ sourceModule: "payment", sourceId: payment._id });
      console.log(`✅ Payment account transaction deleted: ${payment.receiptId}`);
    } catch (err) {
      console.warn("Could not delete account transaction:", err.message);
    }

    // Reverse effects on sale (WITHOUT relying on middleware)
    const sale = await Sales.findById(payment.invoice);
    if (sale) {
      sale.paidAmount = Math.max(0, (sale.paidAmount || 0) - payment.amount);
      sale.dueAmount = sale.totalAmount - sale.paidAmount;

      if (sale.dueAmount === sale.totalAmount) {
        sale.paymentStatus = "Unpaid";
      } else if (sale.paidAmount > 0) {
        sale.paymentStatus = "Partial";
      } else {
        sale.paymentStatus = "Unpaid";
      }

      await sale.save();
    }

    // Reverse effects on customer
    const customer = await Customer.findById(payment.customer);
    if (customer) {
      customer.balance = (customer.balance || 0) + payment.amount;
      await customer.save();
    }

    res.status(200).json({ 
      success: true,
      message: "Payment reversed successfully",
      payment
    });
  } catch (err) {
    console.error("Error in reversePayment:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================
// GET PAYMENT SUMMARY BY PERIOD
// =====================
exports.getPaymentSummary = async (req, res, next) => {
  try {
    const { period, year, month, paymentMethod } = req.query;
    
    let startDate, endDate;
    const today = new Date();
    
    if (period === 'daily') {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    } else if (period === 'monthly' || (year && month)) {
      const targetYear = year || today.getFullYear();
      const targetMonth = month || today.getMonth() + 1;
      startDate = new Date(targetYear, targetMonth - 1, 1);
      endDate = new Date(targetYear, targetMonth, 0);
    } else if (period === 'yearly' || year) {
      const targetYear = year || today.getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    let filter = {
      paymentDate: { $gte: startDate, $lte: endDate },
      isReversed: { $ne: true }
    };

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate("customer", "customerName shopName")
      .populate("salesman", "username");

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Group by payment method
    const methodBreakdown = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'Cash';
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = 0;
      }
      methodBreakdown[method] += payment.amount;
    });

    // Daily breakdown
    const dailyBreakdown = {};
    payments.forEach(payment => {
      const dateKey = payment.paymentDate.toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = 0;
      }
      dailyBreakdown[dateKey] += payment.amount;
    });

    res.status(200).json({
      success: true,
      period: period || 'monthly',
      startDate,
      endDate,
      summary: {
        totalPayments: payments.length,
        totalAmount,
        averagePayment: payments.length > 0 ? totalAmount / payments.length : 0
      },
      methodBreakdown,
      dailyBreakdown,
      payments
    });
  } catch (err) {
    console.error("Error in getPaymentSummary:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};