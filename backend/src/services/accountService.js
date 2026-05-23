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

    const lastBalance = await getLastBalance();

    // Calculate new balance
    let newBalance = lastBalance;
    if (income > 0) {
      newBalance = lastBalance + income;
    } else if (expense > 0) {
      newBalance = lastBalance - expense;
    }

    // Calculate total amount (running total)
    const totalAmount = lastBalance + income - expense;

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

    // Get all transactions after this one to recalculate balances
    const laterTransactions = await Account.find({
      date: { $gte: transaction.date },
      _id: { $ne: transactionId }
    }).sort({ date: 1, createdAt: 1 });

    // Update the transaction
    Object.assign(transaction, updateData);
    await transaction.save();

    // Recalculate balances for later transactions
    let currentBalance = transaction.balance;
    for (const laterTx of laterTransactions) {
      if (laterTx.income > 0) {
        currentBalance += laterTx.income;
      } else if (laterTx.expense > 0) {
        currentBalance -= laterTx.expense;
      }
      laterTx.balance = currentBalance;
      await laterTx.save();
    }

    return transaction;
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

    await transaction.deleteOne();
    return { success: true, message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};