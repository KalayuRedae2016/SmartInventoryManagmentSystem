
const catchAsync = require('../../utils/catchAsync');
const {User,Sale,Purchase,StockAdjustment,StockTransfer}=require('../../models');

// Basic Reports,Total users
// Active vs Inactive users
//Users by role,Users created by date range
//Users per business (if multi-business)
//Activity Reports,User login history,
// Last login report,User sales performance
//User purchase activity,Users with no activity

// User Summary
// exports.getUserSummary = catchAsync(async (req, res) => {
//   const users = await User.findAll({
//     include: [
//       { model: Sale, required: false },
//       { model: Purchase, required: false },
//       { model: StockAdjustment, required: false },
//       { model: StockTransfer, required: false }
//     ]
//   });

//   console.log("users",users)

//   const summary = users.map(u => ({
//     userId: u.id,
//     fullName: u.fullName,
//     totalSales: u.Sales.length,
//     totalPurchases: u.Purchases.length,
//     totalAdjustments: u.StockAdjustments.length,
//     totalTransfers: u.StockTransfers.length,
//     roleId: u.roleId,
//     isActive: u.isActive
//   }));

//   res.status(200).json({ status: 1, data: summary });
// });

// controllers/reports/user.report.controller.js

exports.getUserSummary = catchAsync(async (req, res) => {
    const totalUsers = await User.countDocuments()

    const activeUsers = await User.count({ isActive: true })
    const inactiveUsers = await User.count({ isActive: false })

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole
    })
  })

// User Detailed Report
exports.getUserDetail = catchAsync(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  const users = await User.findAll({
    where: userId ? { id: userId } : {},
    include: [
      { model: Sale, required: false, where: { saleDate: getDateFilter(startDate, endDate) } },
      { model: Purchase, required: false, where: { createdAt: getDateFilter(startDate, endDate) } },
      { model: StockAdjustment, required: false, where: { createdAt: getDateFilter(startDate, endDate) } },
      { model: StockTransfer, required: false, where: { createdAt: getDateFilter(startDate, endDate) } }
    ]
  });

  const details = users.map(u => ({
    userId: u.id,
    fullName: u.fullName,
    roleId: u.roleId,
    isActive: u.isActive,
    sales: u.Sales.map(s => ({ id: s.id, totalAmount: s.totalAmount, saleDate: s.saleDate })),
    purchases: u.Purchases.map(p => ({ id: p.id, totalAmount: p.totalAmount, date: p.createdAt })),
    adjustments: u.StockAdjustments.map(a => ({ id: a.id, type: a.adjustmentType, quantity: a.quantity })),
    transfers: u.StockTransfers.map(t => ({ id: t.id, quantity: t.quantity, from: t.fromWarehouseId, to: t.toWarehouseId }))
  }));

  res.status(200).json({ status: 1, data: details });
});

exports.userActivity=catchAsync(async(req,res)=>{
  console.log('f')
})

exports.loginReport=catchAsync(async(req,res)=>{
  console.log('f')
})

