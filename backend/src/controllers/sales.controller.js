// controllers/salesController.js
const Sales = require("../models/sales.model");
const Item = require("../models/item.model");
const Customer = require("../models/customer.model");
const User = require("../models/User.model");
const { addTransaction } = require("../services/accountService");

// =====================
// CREATE SALES INVOICE
// =====================
exports.createSale = async (req, res, next) => {
  try {
    const { customer, items, discount = 0, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer and items are required"
      });
    }

    // VALIDATE CUSTOMER
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // ROUTE RESTRICTION (SALES MAN)
    if (req.user.role === "salesman") {
      const user = await User.findById(req.user._id);
      if (!user.assignedRoutes.includes(customerDoc.route.toString())) {
        return res.status(403).json({
          success: false,
          message: "You can only create sales for your assigned routes"
        });
      }
    }

    // BUILD ITEMS + CALCULATE TOTAL
    let subTotal = 0;
    const formattedItems = [];

    for (const i of items) {
      const itemDoc = await Item.findById(i.item);
      if (!itemDoc) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid item selected" 
        });
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

    // AUTO INVOICE ID
    const last = await Sales.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (last?.invoiceId) {
      const match = last.invoiceId.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    const invoiceId = `INV-${String(nextNumber).padStart(3, "0")}`;

    // CREATE SALES INVOICE WITH PAYMENT TRACKING FIELDS
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
      paidAmount: 0,           // Initialize paid amount
      dueAmount: totalAmount,   // Initialize due amount as total amount
      paymentStatus: "Unpaid",  // Initial payment status
      status: "Completed",
      notes
    });

    // UPDATE CUSTOMER BALANCE
    customerDoc.balance = (customerDoc.balance || 0) + totalAmount;
    await customerDoc.save();

    // RECORD SALE INCOME IN ACCOUNTS
    try {
      await addTransaction({
        date: sale.invoiceDate,
        invoiceNo: sale.invoiceId,
        description: `Product Sales - ${customerDoc.customerName}`,
        income: sale.totalAmount,
        expense: 0,
        sourceModule: "sales",
        sourceId: sale._id,
        enteredBy: req.user._id,
        notes: notes || "Sales income"
      });
      console.log(`✅ Sales transaction added to accounts: ${sale.invoiceId} - LKR ${sale.totalAmount}`);
    } catch (accountErr) {
      console.error("Failed to add sales to account ledger:", accountErr);
    }

    // Populate sale details for response
    const populatedSale = await Sales.findById(sale._id)
      .populate("customer", "customerName shopName")
      .populate("route", "name")
      .populate("salesman", "username");

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale: populatedSale
    });

  } catch (err) {
    console.error("Error in createSale:", err);
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

    // Calculate summary with proper payment tracking
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalDue = sales.reduce((sum, s) => sum + (s.dueAmount || s.totalAmount || 0), 0);

    res.json({
      success: true,
      summary: {
        totalSales,
        totalAmount,
        totalPaid,
        totalDue
      },
      sales
    });
  } catch (err) {
    console.error("Error in getSales:", err);
    next(err);
  }
};

// =====================
// GET SALES INVOICE POPUP LIST
// =====================
exports.getSalesPopupList = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    const sales = await Sales.find(filter)
      .select("_id invoiceId invoiceDate totalAmount dueAmount paidAmount paymentStatus")
      .sort({ createdAt: -1 });

    const formattedSales = sales.map((sale) => ({
      _id: sale._id,
      invoiceId: sale.invoiceId,
      invoiceDate: sale.invoiceDate,
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount || 0,
      dueAmount: sale.dueAmount || sale.totalAmount,
      paymentStatus: sale.paymentStatus || "Unpaid",
      displayName: `${sale.invoiceId} - Due: ${((sale.dueAmount || sale.totalAmount) - (sale.paidAmount || 0)).toLocaleString()}`
    }));

    res.status(200).json({
      success: true,
      sales: formattedSales
    });
  } catch (err) {
    console.error("Error in getSalesPopupList:", err);
    next(err);
  }
};

// =====================
// GET SINGLE SALE
// =====================
exports.getSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sale = await Sales.findById(id)
      .populate("customer", "customerName shopName phoneNumber email")
      .populate("route", "name city")
      .populate("salesman", "username fullName");

    if (!sale) {
      return res.status(404).json({ 
        success: false,
        message: "Sale not found" 
      });
    }

    if (
      req.user.role === "salesman" &&
      sale.salesman._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    res.status(200).json({
      success: true,
      sale
    });
  } catch (err) {
    console.error("Error in getSale:", err);
    next(err);
  }
};

// =====================
// UPDATE SALE (e.g., add payment, update status)
// =====================
exports.updateSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paidAmount, status, notes } = req.body;

    const sale = await Sales.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    const oldPaidAmount = sale.paidAmount || 0;

    if (paidAmount !== undefined && paidAmount > 0) {
      // Validate payment doesn't exceed due amount
      const currentDue = sale.dueAmount || (sale.totalAmount - oldPaidAmount);
      if (paidAmount > currentDue) {
        return res.status(400).json({
          success: false,
          message: `Payment amount cannot exceed due amount of ${currentDue}`
        });
      }

      sale.paidAmount = oldPaidAmount + paidAmount;
      sale.dueAmount = sale.totalAmount - sale.paidAmount;
      
      if (sale.dueAmount === 0) {
        sale.paymentStatus = "Paid";
      } else if (sale.paidAmount > 0) {
        sale.paymentStatus = "Partial";
      } else {
        sale.paymentStatus = "Unpaid";
      }
    }

    if (status) sale.status = status;
    if (notes) sale.notes = notes;

    await sale.save();

    // If payment was added, update customer balance
    if (paidAmount !== undefined && paidAmount > 0) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.balance = Math.max(0, (customer.balance || 0) - paidAmount);
        await customer.save();
      }
    }

    const populatedSale = await Sales.findById(sale._id)
      .populate("customer", "customerName shopName")
      .populate("route", "name")
      .populate("salesman", "username");

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      sale: populatedSale
    });
  } catch (err) {
    console.error("Error in updateSale:", err);
    next(err);
  }
};

// =====================
// ADD PAYMENT TO SALE (Separate endpoint for payments)
// =====================
exports.addPaymentToSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required"
      });
    }

    const sale = await Sales.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    const currentDue = sale.dueAmount || (sale.totalAmount - (sale.paidAmount || 0));
    
    if (amount > currentDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed due amount of ${currentDue}`
      });
    }

    // Update sale payment fields
    sale.paidAmount = (sale.paidAmount || 0) + amount;
    sale.dueAmount = sale.totalAmount - sale.paidAmount;
    
    if (sale.dueAmount === 0) {
      sale.paymentStatus = "Paid";
    } else if (sale.paidAmount > 0) {
      sale.paymentStatus = "Partial";
    }

    await sale.save();

    // Update customer balance
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      customer.balance = Math.max(0, (customer.balance || 0) - amount);
      await customer.save();
    }

    // Generate receipt ID for payment
    const Payment = require("../models/payment.model");
    const last = await Payment.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (last?.receiptId) {
      const match = last.receiptId.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    const receiptId = `REC-${String(nextNumber).padStart(3, "0")}`;

    // Create payment record
    const payment = await Payment.create({
      receiptId,
      customer: sale.customer,
      invoice: sale._id,
      route: sale.route,
      salesman: req.user._id,
      amount,
      paymentMethod: paymentMethod || "Cash",
      notes: notes || `Payment for invoice ${sale.invoiceId}`
    });

    // Record in accounts
    try {
      await addTransaction({
        date: new Date(),
        invoiceNo: receiptId,
        description: `Payment Received - ${customer?.customerName || 'Customer'} - Invoice ${sale.invoiceId}`,
        income: amount,
        expense: 0,
        sourceModule: "payment",
        sourceId: payment._id,
        enteredBy: req.user._id,
        notes: notes || `Payment for invoice ${sale.invoiceId}`
      });
      console.log(`✅ Payment transaction added to accounts: ${receiptId}`);
    } catch (accountErr) {
      console.error("Failed to record account transaction:", accountErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment added successfully",
      sale: {
        _id: sale._id,
        invoiceId: sale.invoiceId,
        paidAmount: sale.paidAmount,
        dueAmount: sale.dueAmount,
        paymentStatus: sale.paymentStatus
      },
      payment
    });
  } catch (err) {
    console.error("Error in addPaymentToSale:", err);
    next(err);
  }
};

// =====================
// DELETE SALE
// =====================
exports.deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // DELETE FROM ACCOUNT LEDGER
    try {
      const Account = require("../models/Account.model");
      await Account.deleteOne({ sourceModule: "sales", sourceId: sale._id });
      console.log(`✅ Sales account transaction deleted: ${sale.invoiceId}`);
    } catch (accountErr) {
      console.error("Failed to delete from account ledger:", accountErr);
    }

    // Reverse customer balance
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      customer.balance = Math.max(0, (customer.balance || 0) - sale.totalAmount);
      await customer.save();
    }

    await sale.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteSale:", err);
    next(err);
  }
};

// =====================
// GET SALES SUMMARY BY PERIOD
// =====================
exports.getSalesSummary = async (req, res, next) => {
  try {
    const { period, year, month } = req.query;
    
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
      invoiceDate: { $gte: startDate, $lte: endDate }
    };

    if (req.user.role === "salesman") {
      filter.salesman = req.user._id;
    }

    const sales = await Sales.find(filter)
      .populate("customer", "customerName shopName");

    const totalAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalDue = sales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

    const customerBreakdown = {};
    sales.forEach(sale => {
      const customerName = sale.customer?.customerName || 'Unknown';
      if (!customerBreakdown[customerName]) {
        customerBreakdown[customerName] = {
          totalAmount: 0,
          totalPaid: 0,
          totalDue: 0,
          invoiceCount: 0
        };
      }
      customerBreakdown[customerName].totalAmount += sale.totalAmount;
      customerBreakdown[customerName].totalPaid += sale.paidAmount || 0;
      customerBreakdown[customerName].totalDue += sale.dueAmount || 0;
      customerBreakdown[customerName].invoiceCount++;
    });

    res.status(200).json({
      success: true,
      period: period || 'monthly',
      startDate,
      endDate,
      summary: {
        totalInvoices: sales.length,
        totalAmount,
        totalPaid,
        totalDue,
        averageInvoiceValue: sales.length > 0 ? totalAmount / sales.length : 0
      },
      customerBreakdown,
      sales
    });
  } catch (err) {
    console.error("Error in getSalesSummary:", err);
    next(err);
  }
};