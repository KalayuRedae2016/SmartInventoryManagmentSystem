const catchAsync = require('../utils/catchAsync');
const { Op, Sequelize } = require('sequelize');
const { User, Sale, Purchase, StockAdjustment, StockTransfer } = require('../models');

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
// BASIC SUMMARY
exports.getUserSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const totalUsers = await User.count();

  const activeUsers = await User.count({ where: { isActive: true } });
  const inactiveUsers = await User.count({ where: { isActive: false } });

  console.log("acti",activeUsers)
  // Users by role
  const usersByRole = await User.findAll({
    attributes: [
      'roleId','fullName',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['roleId']
  });

  // Users by date
  const usersByDate = await User.count({
    where: {
      createdAt: buildDateFilter(startDate, endDate)
    }
  });

  res.json({
    status: 1,
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersByRole,
    usersByDate
    
  });
});

// USER DETAIL
exports.getUserDetail = catchAsync(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  const users = await User.findAll({
    where: userId ? { id: userId } : {},
    include: [
      {
        model: Sale,as:"sales",
        required: false,
        where: { saleDate: buildDateFilter(startDate, endDate) }
      },
      {
        model: Purchase,as:"purchases",
        required: false,
        where: { createdAt: buildDateFilter(startDate, endDate) }
      },
      {
        model: StockAdjustment,as:"user",
        required: false,
        where: { createdAt: buildDateFilter(startDate, endDate) }
      },
      {
        model: StockTransfer,as:"user",
        required: false,
        where: { createdAt: buildDateFilter(startDate, endDate) }
      }
    ]
  });

  const details = users.map(u => ({
    userId: u.id,
    fullName: u.fullName,
    roleId: u.roleId,
    isActive: u.isActive,

    totalSales: u.Sales.length,
    totalSalesAmount: u.Sales.reduce((sum, s) => sum + s.totalAmount, 0),

    totalPurchases: u.Purchases.length,
    totalPurchaseAmount: u.Purchases.reduce((sum, p) => sum + p.totalAmount, 0),

    totalAdjustments: u.StockAdjustments.length,
    totalTransfers: u.StockTransfers.length
  }));

  res.json({ status: 1, data: details });
});

// USER ACTIVITY 
exports.userActivity = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const users = await User.findAll({
    include: [
      {
        model: Sale,
        required: false,
        where: { saleDate: buildDateFilter(startDate, endDate) }
      },
      {
        model: Purchase,
        required: false,
        where: { createdAt: getDateFilter(startDate, endDate) }
      }
    ]
  });

  const activity = users.map(u => ({
    userId: u.id,
    name: u.fullName,
    salesCount: u.Sales.length,
    purchaseCount: u.Purchases.length,
    totalActivity: u.Sales.length + u.Purchases.length
  }));

  res.json({ status: 1, data: activity });
});

// USERS WITH NO ACTIVITY 
exports.inactiveUsers = catchAsync(async (req, res) => {
  const users = await User.findAll({
    include: [
      { model: Sale, required: false },
      { model: Purchase, required: false }
    ]
  });

  const result = users.filter(
    u => u.Sales.length === 0 && u.Purchases.length === 0
  );

  res.json({ status: 1, data: result });
});

// // ================= LOGIN REPORT =================
// // (only if you have lastLogin field)
// exports.loginReport = catchAsync(async (req, res) => {
//   const users = await User.findAll({
//     attributes: ['id', 'fullName', 'lastLogin']
//   });

//   res.json({ status: 1, data: users });
// });