const {db}= require('../models');

const User=db.User

const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) return { [Op.between]: [startDate, endDate] };
  return {};
};


exports.getUserReport = catchAsync(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  const users = await User.findAll({
    where: userId ? { id: userId } : {},
    include: [
      {
        model: Sale,
        attributes: ['id', 'totalAmount', 'createdAt'],
        where: { saleDate: getDateFilter(startDate, endDate) },
        required: false
      },
      {
        model: Purchase,
        attributes: ['id', 'totalAmount', 'createdAt'],
        where: { createdAt: getDateFilter(startDate, endDate) },
        required: false
      },
      {
        model: StockTransfer,
        attributes: ['id', 'quantity', 'createdAt'],
        where: { createdAt: getDateFilter(startDate, endDate) },
        required: false
      },
      {
        model: StockAdjustment,
        attributes: ['id', 'quantity', 'adjustmentType', 'createdAt'],
        where: { createdAt: getDateFilter(startDate, endDate) },
        required: false
      }
    ]
  });

  const report = users.map(u => ({
    username: u.username,
    totalSales: u.Sales.reduce((a, s) => a + s.totalAmount, 0),
    totalPurchases: u.Purchases.reduce((a, p) => a + p.totalAmount, 0),
    totalTransfers: u.StockTransfers.reduce((a, t) => a + t.quantity, 0),
    totalAdjustments: u.StockAdjustments.reduce((a, a2) => a + a2.quantity, 0),
    userId: u.id
  }));

  res.status(200).json({ status: 1, data: report });
});

exports.getBestCustomers = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const customers = await Customer.findAll({
    include: [{
      model: Sale,
      include: [{ model: SaleItem }],
      where: { saleDate: getDateFilter(startDate, endDate) },
      required: false
    }]
  });

  const report = customers.map(c => {
    const totalSalesAmount = c.Sales.reduce((sum, s) => sum + s.totalAmount, 0);
    return {
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalSales: c.Sales.length,
      totalAmount: totalSalesAmount
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  res.status(200).json({ status: 1, data: report });
});

exports.getSupplierReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const suppliers = await Supplier.findAll({
    include: [{
      model: Purchase,
      include: [{ model: PurchaseReturn, include: [PurchaseReturnItem] }],
      where: { createdAt: getDateFilter(startDate, endDate) },
      required: false
    }]
  });

  const report = suppliers.map(s => {
    const totalPurchases = s.Purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPurchaseReturns = s.Purchases.reduce((sum, p) =>
      sum + p.PurchaseReturns.reduce((rSum, r) => rSum + r.totalAmount, 0), 0
    );

    const paidAmount = s.Purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const dueAmount = totalPurchases - paidAmount;

    return {
      name: s.name,
      phone: s.phone,
      totalPurchases,
      totalPurchaseReturns,
      paidAmount,
      dueAmount
    };
  });

  res.status(200).json({ status: 1, data: report });
});

exports.getPurchaseReport = catchAsync(async (req, res) => {
  const { warehouseId, supplierId, startDate, endDate } = req.query;

  const where = { createdAt: getDateFilter(startDate, endDate) };
  if (warehouseId) where.warehouseId = warehouseId;
  if (supplierId) where.supplierId = supplierId;

  const purchases = await Purchase.findAll({
    where,
    include: [Supplier, Warehouse]
  });

  const report = purchases.map(p => ({
    date: p.createdAt,
    reference: p.id,
    supplier: p.Supplier.name,
    warehouse: p.Warehouse.name,
    status: p.status,
    grandTotal: p.totalAmount,
    paid: p.paidAmount,
    due: p.dueAmount
  }));

  res.status(200).json({ status: 1, data: report });
});

exports.getSaleReport = catchAsync(async (req, res) => {
  const { warehouseId, customerId, startDate, endDate } = req.query;

  const where = { saleDate: getDateFilter(startDate, endDate) };
  if (warehouseId) where.warehouseId = warehouseId;
  if (customerId) where.customerId = customerId;

  const sales = await Sale.findAll({
    where,
    include: [Customer, Warehouse]
  });

  const report = sales.map(s => ({
    date: s.saleDate,
    reference: s.id,
    customer: s.Customer.name,
    warehouse: s.Warehouse.name,
    status: s.status,
    grandTotal: s.totalAmount,
    paid: s.totalAmount - s.due,
    due: s.due
  }));

  res.status(200).json({ status: 1, data: report });
});

exports.getStockReport = catchAsync(async (req, res) => {
  const { warehouseId, productId } = req.query;
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const stocks = await Stock.findAll({
    where,
    include: [Product, Warehouse]
  });

  const report = stocks.map(s => ({
    code: s.Product.code,
    name: s.Product.name,
    category: s.Product.category,
    price: s.Product.price,
    currentStock: s.quantity
  }));

  res.status(200).json({ status: 1, data: report });
});

exports.getProfitLossReport = catchAsync(async (req, res) => {
  const { startDate, endDate, method = 'FIFO' } = req.query;

  // Example: you can calculate based on stock valuation method
  // This requires joining SaleItems, PurchaseItems, PurchaseReturns, SaleReturns, Expenses
  // For now, just placeholder structure
  const report = {
    salesAmount: 0,
    purchaseAmount: 0,
    salesReturn: 0,
    purchaseReturn: 0,
    expenses: 0,
    revenue: 0,
    profitFIFO: 0,
    profitLIFO: 0,
    profitAverage: 0,
    paymentsReceived: 0,
    paymentsSent: 0,
    paymentsNet: 0
  };

  res.status(200).json({ status: 1, data: report });
});

exports.getPaymentsReport = catchAsync(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  // type: purchase, sale, purchase-return, sale-return
  // Build queries accordingly
  res.status(200).json({ status: 1, data: [] });
});
