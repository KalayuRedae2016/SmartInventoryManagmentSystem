const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getDateFilter } = require('../utils/reportHelpers');

const Sale = db.Sale;
const Purchase = db.Purchase;
const PurchaseReturn = db.PurchaseReturn;
const SaleReturn = db.SaleReturn;
const StockAdjustment = db.StockAdjustment;
const Expense = db.Expense; // assuming you have an Expense model


// # 7️⃣ Financial Reports
// From **Sales + Purchases**
// 1. **Profit & Loss**
//    * total sales
//    * total purchase
//    * profit
// 2. **Revenue Report**
// 3. **Expense Report**
// 4. **Payment Collection Report**


// Profit & Loss Report
exports.getProfitLossReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const sales = await Sale.findAll({ where: { saleDate: getDateFilter(startDate, endDate) } });
  const purchases = await Purchase.findAll({ where: { createdAt: getDateFilter(startDate, endDate) } });
  const saleReturns = await SaleReturn.findAll({ where: { returnDate: getDateFilter(startDate, endDate) } });
  const purchaseReturns = await PurchaseReturn.findAll({ where: { createdAt: getDateFilter(startDate, endDate) } });
  const expenses = await Expense.findAll({ where: { date: getDateFilter(startDate, endDate) } });

  const salesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const purchaseAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const salesReturnAmount = saleReturns.reduce((sum, s) => sum + s.totalAmount, 0);
  const purchaseReturnAmount = purchaseReturns.reduce((sum, p) => sum + p.totalAmount, 0);
  const expensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const netProfit = salesAmount - purchaseAmount - expensesAmount - salesReturnAmount + purchaseReturnAmount;

  res.status(200).json({
    status: 1,
    data: {
      salesAmount,
      purchaseAmount,
      salesReturnAmount,
      purchaseReturnAmount,
      expensesAmount,
      netProfit
    }
  });
});