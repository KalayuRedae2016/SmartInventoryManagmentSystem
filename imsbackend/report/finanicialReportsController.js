const catchAsync = require('../utils/catchAsync');
const { Sequelize } = require('sequelize');

const {Sale,Purchase,PurchaseReturn,SaleReturn,Expense}=require('../models');

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  }
  return {};// No filter → return empty (get all users)
};


exports.getFinancialReport = catchAsync(async (req, res) => {
  const {
    type,        // profit | revenue | expense | collection
    startDate,
    endDate,
    groupBy      // day | month (optional)
  } = req.query;

  // Filters
  const saleFilter = startDate && endDate
    ? { saleDate: buildDateFilter(startDate, endDate) }
    : {};

  const purchaseFilter = startDate && endDate
    ? { createdAt: buildDateFilter(startDate, endDate) }
    : {};

  const saleReturnFilter = startDate && endDate
    ? { returnDate: buildDateFilter(startDate, endDate) }
    : {};

  const purchaseReturnFilter = startDate && endDate
    ? { createdAt: buildDateFilter(startDate, endDate) }
    : {};

  const expenseFilter = startDate && endDate
    ? { date: buildDateFilter(startDate, endDate) }
    : {};

  let data;

  switch (type) {

    // ================= PROFIT & LOSS =================
    case 'profit': {
      const [
        salesAmount,
        purchaseAmount,
        salesReturnAmount,
        purchaseReturnAmount,
        expensesAmount
      ] = await Promise.all([
        Sale.sum('totalAmount', { where: saleFilter }),
        Purchase.sum('totalAmount', { where: purchaseFilter }),
        SaleReturn.sum('totalAmount', { where: saleReturnFilter }),
        PurchaseReturn.sum('totalAmount', { where: purchaseReturnFilter }),
        Expense ? Expense.sum('amount', { where: expenseFilter }) : 0
      ]);

      const totalSales = salesAmount || 0;
      const totalPurchase = purchaseAmount || 0;
      const totalSalesReturn = salesReturnAmount || 0;
      const totalPurchaseReturn = purchaseReturnAmount || 0;
      const totalExpense = expensesAmount || 0;

      const grossProfit = totalSales - totalPurchase;

      const netProfit =
        totalSales
        - totalSalesReturn
        - totalPurchase
        - totalExpense
        + totalPurchaseReturn;

      data = {
        totalSales,
        totalPurchase,
        totalSalesReturn,
        totalPurchaseReturn,
        totalExpense,
        grossProfit,
        netProfit
      };
      break;
    }

    // ================= REVENUE =================
    case 'revenue': {
      if (groupBy === 'day') {
        data = await Sale.findAll({
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('saleDate')), 'date'],
            [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'revenue']
          ],
          where: saleFilter,
          group: ['date'],
          order: [['date', 'ASC']]
        });

      } else if (groupBy === 'month') {
        data = await Sale.findAll({
          attributes: [
            [Sequelize.fn('DATE_FORMAT', Sequelize.col('saleDate'), '%Y-%m'), 'month'],
            [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'revenue']
          ],
          where: saleFilter,
          group: ['month'],
          order: [['month', 'ASC']]
        });

      } else {
        const revenue = await Sale.sum('totalAmount', { where: saleFilter });
        data = { totalRevenue: revenue || 0 };
      }
      break;
    }

    // ================= EXPENSE =================
    case 'expense': {
      const totalPurchase = await Purchase.sum('totalAmount', {
        where: purchaseFilter
      });

      let otherExpenses = 0;

      if (Expense) {
        otherExpenses = await Expense.sum('amount', {
          where: expenseFilter
        });
      }

      data = {
        totalPurchase: totalPurchase || 0,
        otherExpenses: otherExpenses || 0,
        totalExpense: (totalPurchase || 0) + (otherExpenses || 0)
      };
      break;
    }

    // ================= COLLECTION =================
    case 'collection': {
      const totalPaid = await Sale.sum('paidAmount', {
        where: saleFilter
      });

      const totalDue = await Sale.sum('dueAmount', {
        where: saleFilter
      });

      data = {
        totalPaid: totalPaid || 0,
        totalDue: totalDue || 0
      };
      break;
    }

    // ================= DEFAULT =================
    default:
      return res.status(400).json({
        status: 0,
        message: 'Invalid type. Use profit | revenue | expense | collection'
      });
  }

  res.json({
    status: 1,
    type,
    data
  });
});