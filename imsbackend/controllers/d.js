'use strict';

const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

const User = db.User;
const Sale = db.Sale;
const SaleItem = db.SaleItem;
const Purchase = db.Purchase;
const PurchaseItem = db.PurchaseItem;
const PurchaseReturn = db.PurchaseReturn;
const PurchaseReturnItem = db.PurchaseReturnItem;
const Customer = db.Customer;
const Supplier = db.Supplier;
const Stock = db.Stock;
const StockAdjustment = db.StockAdjustment;
const StockTransfer = db.StockTransfer;
const Warehouse = db.Warehouse;
const Product = db.Product;

// Helper to build date filters
const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) return { [Op.between]: [startDate, endDate] };
  if (startDate) return { [Op.gte]: startDate };
  if (endDate) return { [Op.lte]: endDate };
  return {};
};

// ---------------- Dashboard ----------------
exports.dashboardData = catchAsync(async (req, res) => {
  // Placeholder: you can count total users, sales, purchases, stock value, etc.
  const totalUsers = await User.count();
  const totalSales = await Sale.sum('totalAmount');
  const totalPurchases = await Purchase.sum('totalAmount');
  const totalStock = await Stock.sum('quantity');

  res.status(200).json({
    status: 1,
    data: {
      totalUsers,
      totalSales,
      totalPurchases,
      totalStock
    }
  });
});

// ---------------- User Reports ----------------
exports.getUserReport = catchAsync(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  const users = await User.findAll({
    where: userId ? { id: userId } : {},
    include: [
      {
        model: Sale,
        attributes: ['id', 'totalAmount', 'saleDate'],
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
    username: u.fullName,
    totalSales: u.Sales?.reduce((a, s) => a + s.totalAmount, 0) || 0,
    totalPurchases: u.Purchases?.reduce((a, p) => a + p.totalAmount, 0) || 0,
    totalTransfers: u.StockTransfers?.reduce((a, t) => a + t.quantity, 0) || 0,
    totalAdjustments: u.StockAdjustments?.reduce((a, a2) => a + a2.quantity, 0) || 0,
    userId: u.id
  }));

  res.status(200).json({ status: 1, data: report });
});

// ---------------- Customer Reports ----------------
exports.getBestCustomers = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const customers = await Customer.findAll({
    include: [{
      model: Sale,
      include: [{ model: SaleItem }],
      where: { saleDate: getDateFilter(startDate, endDate), ...(warehouseId && { warehouseId }) },
      required: false
    }]
  });

  const report = customers.map(c => {
    const totalSalesAmount = c.Sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
    return {
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalSales: c.Sales?.length || 0,
      totalAmount: totalSalesAmount
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  res.status(200).json({ status: 1, data: report });
});

// ---------------- Supplier Reports ----------------
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
    const totalPurchases = s.Purchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0;
    const totalPurchaseReturns = s.Purchases?.reduce((sum, p) =>
      sum + p.PurchaseReturns?.reduce((rSum, r) => rSum + r.totalAmount, 0) || 0, 0
    ) || 0;

    const paidAmount = s.Purchases?.reduce((sum, p) => sum + p.paidAmount, 0) || 0;
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

// ---------------- Purchase Reports ----------------
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
    supplier: p.Supplier?.name,
    warehouse: p.Warehouse?.name,
    status: p.status,
    grandTotal: p.totalAmount,
    paid: p.paidAmount,
    due: p.dueAmount
  }));

  res.status(200).json({ status: 1, data: report });
});

// ---------------- Sale Reports ----------------
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
    customer: s.Customer?.name,
    warehouse: s.Warehouse?.name,
    status: s.status,
    grandTotal: s.totalAmount,
    paid: s.totalAmount - s.due,
    due: s.due
  }));

  res.status(200).json({ status: 1, data: report });
});

// ---------------- Stock Reports ----------------
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
    code: s.Product?.code,
    name: s.Product?.name,
    category: s.Product?.category,
    price: s.Product?.defaultCostPrice,
    currentStock: s.quantity
  }));

  res.status(200).json({ status: 1, data: report });
});

// ---------------- Profit & Loss Placeholder ----------------
exports.getProfitLossReport = catchAsync(async (req, res) => {
  const { startDate, endDate, method = 'FIFO' } = req.query;

  // Placeholder: extend with actual calculation logic joining saleItems, purchaseItems, etc.
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

// ---------------- Payments Placeholder ----------------
exports.getPaymentsReport = catchAsync(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  // type: purchase, sale, purchase-return, sale-return
  // Extend with queries for payment filtering
  res.status(200).json({ status: 1, data: [] });
});