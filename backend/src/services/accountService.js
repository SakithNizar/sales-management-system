// services/accountService.js
const Account = require("../models/Account.model");

// ===============================
// HELPER: Get last balance
// ===============================
const getLastBalance = async () => {
  const lastTransaction = await Account.findOne().sort({ date: -1, createdAt: -1 });
  return lastTransaction?.balance || 0;
};

// ===============================
// HELPER: Get all transactions in correct order
// ===============================
const getAllTransactionsOrdered = async () => {
  return await Account.find().sort({ date: 1, createdAt: 1 });
};

// ===============================
// HELPER: Recalculate all balances (full recalculation)
// ===============================
const recalculateAllBalances = async () => {
  try {
    const transactions = await getAllTransactionsOrdered();
    let runningBalance = 0;
    
    for (const transaction of transactions) {
      if (transaction.income > 0) {
        runningBalance += transaction.income;
      }
      if (transaction.expense > 0) {
        runningBalance -= transaction.expense;
      }
      
      transaction.balance = runningBalance;
      transaction.totalAmount = (transaction.income || 0) - (transaction.expense || 0);
      await transaction.save();
    }
    
    console.log(`✅ Full recalculation completed for ${transactions.length} transactions, Final Balance: ${runningBalance}`);
    return runningBalance;
  } catch (error) {
    console.error("Error in full recalculation:", error);
    throw error;
  }
};

// ===============================
// ADD TRANSACTION (called by other modules)
// ===============================
exports.addTransaction = async ({
  date,
  invoiceNo,
  description,
  income = 0,
  expense = 0,
  sourceModule,
  sourceId,
  enteredBy,
  notes = ""
}) => {
  try {
    // Input validation
    if (!invoiceNo || !description || !sourceModule || !sourceId || !enteredBy) {
      throw new Error("Missing required fields for account transaction");
    }

    if (income === 0 && expense === 0) {
      throw new Error("Either income or expense must be greater than 0");
    }

    // Get the last transaction to calculate new balance
    const lastTransaction = await Account.findOne().sort({ date: -1, createdAt: -1 });
    const lastBalance = lastTransaction?.balance || 0;

    // Calculate new balance
    let newBalance = lastBalance;
    if (income > 0) {
      newBalance = lastBalance + income;
    } else if (expense > 0) {
      newBalance = lastBalance - expense;
    }

    // Calculate total amount for this transaction
    const totalAmount = (income || 0) - (expense || 0);

    // Create transaction
    const transaction = await Account.create({
      date: date || new Date(),
      invoiceNo,
      description,
      income: income || 0,
      expense: expense || 0,
      totalAmount,
      balance: newBalance,
      sourceModule,
      sourceId,
      enteredBy,
      notes: notes || ""
    });

    console.log(`✅ [ACCOUNT] ${sourceModule.toUpperCase()} - ${invoiceNo}: ${income > 0 ? `+${income}` : `-${expense}`} | Balance: ${newBalance}`);
    return transaction;
  } catch (error) {
    console.error("❌ Account transaction error:", error);
    throw error;
  }
};

// ===============================
// UPDATE TRANSACTION (for corrections)
// ===============================
exports.updateTransaction = async (transactionId, updateData) => {
  try {
    const transaction = await Account.findById(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const oldExpense = transaction.expense;
    const oldIncome = transaction.income;
    const oldBalance = transaction.balance;
    
    console.log(`Updating transaction: ${transaction.invoiceNo}`, {
      oldExpense,
      newExpense: updateData.expense,
      oldIncome,
      newIncome: updateData.income,
      oldBalance
    });
    
    // Update the transaction fields
    if (updateData.income !== undefined) transaction.income = updateData.income;
    if (updateData.expense !== undefined) transaction.expense = updateData.expense;
    if (updateData.notes !== undefined) transaction.notes = updateData.notes;
    if (updateData.description !== undefined) transaction.description = updateData.description;
    
    // Update totalAmount
    transaction.totalAmount = (transaction.income || 0) - (transaction.expense || 0);
    
    // Save the updated transaction
    await transaction.save();
    
    // IMPORTANT: Recalculate ALL balances from the beginning to ensure consistency
    // This is more reliable than trying to recalculate only subsequent transactions
    await recalculateAllBalances();
    
    console.log(`✅ Transaction updated: ${transaction.invoiceNo} | Expense: ${oldExpense} → ${transaction.expense} | Balance recalculated`);
    
    // Get the updated transaction with new balance
    const updatedTransaction = await Account.findById(transactionId);
    return updatedTransaction;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// ===============================
// DELETE TRANSACTION
// ===============================
exports.deleteTransaction = async (transactionId) => {
  try {
    const transaction = await Account.findById(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    
    console.log(`Deleting transaction: ${transaction.invoiceNo}`, {
      expense: transaction.expense,
      income: transaction.income,
      balance: transaction.balance
    });
    
    // Delete the transaction
    await transaction.deleteOne();
    
    // Recalculate all remaining balances
    await recalculateAllBalances();
    
    console.log(`✅ Transaction deleted: ${transaction.invoiceNo} | Balances recalculated`);
    
    return { success: true, message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// ===============================
// RECALCULATE ALL BALANCES (Maintenance function)
// ===============================
exports.recalculateAllBalances = recalculateAllBalances;

// ===============================
// GET TRANSACTIONS WITH CORRECT BALANCES
// ===============================
exports.getTransactionsWithBalances = async (filter = {}) => {
  try {
    const transactions = await Account.find(filter).sort({ date: 1, createdAt: 1 });
    
    let runningBalance = 0;
    const transactionsWithBalance = [];
    
    for (const transaction of transactions) {
      if (transaction.income > 0) {
        runningBalance += transaction.income;
      }
      if (transaction.expense > 0) {
        runningBalance -= transaction.expense;
      }
      
      const transactionObj = transaction.toObject();
      transactionObj.runningBalance = runningBalance;
      transactionsWithBalance.push(transactionObj);
    }
    
    return transactionsWithBalance;
  } catch (error) {
    console.error("Error getting transactions with balances:", error);
    throw error;
  }
};

// ===============================
// FIX BALANCES (Utility function to fix existing data)
// ===============================
exports.fixBalances = async () => {
  console.log("🔄 Starting balance fix for all transactions...");
  const finalBalance = await recalculateAllBalances();
  console.log(`✅ Balance fix completed. Final balance: ${finalBalance}`);
  return { success: true, finalBalance };
};

// ===============================
// GET TRANSACTION BY INVOICE NUMBER
// ===============================
exports.getTransactionByInvoiceNo = async (invoiceNo) => {
  try {
    return await Account.findOne({ invoiceNo });
  } catch (error) {
    console.error("Error getting transaction by invoice number:", error);
    throw error;
  }
};

// ===============================
// GET SUMMARY BY DATE RANGE
// ===============================
exports.getSummaryByDateRange = async (startDate, endDate) => {
  try {
    const transactions = await Account.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    const netProfit = totalIncome - totalExpense;
    
    // Get opening balance before this period
    const beforeTransactions = await Account.find({
      date: { $lt: new Date(startDate) }
    }).sort({ date: -1, createdAt: -1 }).limit(1);
    
    const openingBalance = beforeTransactions[0]?.balance || 0;
    const closingBalance = openingBalance + netProfit;
    
    return {
      startDate,
      endDate,
      openingBalance,
      totalIncome,
      totalExpense,
      netProfit,
      closingBalance,
      transactionCount: transactions.length
    };
  } catch (error) {
    console.error("Error getting summary by date range:", error);
    throw error;
  }
};

// ===============================
// GET CURRENT BALANCE
// ===============================
exports.getCurrentBalance = async () => {
  const lastTransaction = await Account.findOne().sort({ date: -1, createdAt: -1 });
  return lastTransaction?.balance || 0;
};