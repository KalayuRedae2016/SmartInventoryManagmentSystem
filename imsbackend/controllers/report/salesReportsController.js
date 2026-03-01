'use strict';

const { Op } = require('sequelize');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const QueryHelper = require('../../utils/queryHelper');

const { Sale, SaleItem, SaleReturn, SaleReturnItem, Customer, Warehouse, Product, User } = require('../../models');

const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) return { [Op.between]: [new Date(startDate), new Date(endDate)] };
  return {};
};

/**
 * 1️⃣ Sales Summary Report
 */
exports.summary = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const whereSale = {};
  if (startDate && endDate) whereSale.saleDate = getDateFilter(startDate, endDate);
  if (warehouseId) whereSale.warehouseId = warehouseId;

  const sales = await Sale.findAll({ where: whereSale });
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDue = totalAmount - totalPaid;

  res.status(200).json({
    status: 1,
    data: { totalSales, totalAmount, totalPaid, totalDue }
  });
});

/**
 * 2️⃣ Sales Detailed Report
 */
exports.detailed = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId, customerId } = req.query;

  const whereSale = {};
  if (startDate && endDate) whereSale.saleDate = getDateFilter(startDate, endDate);
  if (warehouseId) whereSale.warehouseId = warehouseId;
  if (customerId) whereSale.customerId = customerId;

  const sales = await Sale.findAll({
    where: whereSale,
    include: [
      { model: Customer, attributes: ['id', 'name', 'phone', 'email'] },
      { model: Warehouse, attributes: ['id', 'name'] },
      { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'code', 'cost'] }] }
    ]
  });

  const data = sales.map(s => ({
    saleId: s.id,
    invoice: s.invoiceNumber,
    saleDate: s.saleDate,
    warehouse: s.Warehouse.name,
    customer: s.Customer.name,
    totalAmount: s.totalAmount,
    paid: s.paidAmount,
    due: s.due,
    items: s.SaleItems.map(i => ({
      productId: i.Product.id,
      productName: i.Product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      cost: i.Product.cost,
      profit: i.total - (i.quantity * i.Product.cost)
    }))
  }));

  res.status(200).json({ status: 1, data });
});

/**
 * 3️⃣ Sales By Product Report
 */
exports.byProduct = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const whereSale = {};
  if (startDate && endDate) whereSale.saleDate = getDateFilter(startDate, endDate);
  if (warehouseId) whereSale.warehouseId = warehouseId;

  const results = await SaleItem.findAll({
    include: [
      { model: Sale, where: whereSale, attributes: [] },
      { model: Product, attributes: ['id', 'name', 'code', 'category', 'cost'] }
    ],
    attributes: [
      'productId',
      [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'totalSoldQty'],
      [db.Sequelize.fn('SUM', db.Sequelize.literal('quantity * price')), 'totalRevenue'],
      [db.Sequelize.fn('SUM', db.Sequelize.literal('quantity * Product.cost')), 'totalCost']
    ],
    group: ['productId', 'Product.id'],
    order: [[db.Sequelize.literal('totalRevenue'), 'DESC']]
  });

  const formatted = results.map(r => {
    const revenue = parseFloat(r.get('totalRevenue')) || 0;
    const cost = parseFloat(r.get('totalCost')) || 0;
    const profit = revenue - cost;

    return {
      productId: r.Product.id,
      productName: r.Product.name,
      category: r.Product.category,
      totalSoldQty: parseInt(r.get('totalSoldQty')),
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      marginPercent: revenue === 0 ? 0 : ((profit / revenue) * 100).toFixed(2)
    };
  });

  res.status(200).json({
    status: 1,
    summary: {
      totalProducts: formatted.length,
      totalRevenue: formatted.reduce((s, p) => s + p.totalRevenue, 0),
      totalProfit: formatted.reduce((s, p) => s + p.totalProfit, 0)
    },
    data: formatted
  });
});

/**
 * 4️⃣ Sales By Status Report
 */
exports.byStatus = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const whereSale = {};
  if (startDate && endDate) whereSale.saleDate = getDateFilter(startDate, endDate);
  if (warehouseId) whereSale.warehouseId = warehouseId;

  const sales = await Sale.findAll({ where: whereSale });

  const summary = sales.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json({ status: 1, data: summary });
});

/**
 * 5️⃣ Sales Returns Report
 */
exports.returns = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const whereReturn = {};
  if (startDate && endDate) whereReturn.returnDate = getDateFilter(startDate, endDate);
  if (warehouseId) whereReturn.warehouseId = warehouseId;

  const returns = await SaleReturn.findAll({
    where: whereReturn,
    include: [
      { model: Customer, attributes: ['id', 'name'] },
      { model: SaleReturnItem, include: [{ model: Product, attributes: ['id', 'name', 'code'] }] }
    ]
  });

  const data = returns.map(r => ({
    returnId: r.id,
    customer: r.Customer.name,
    returnDate: r.returnDate,
    totalAmount: r.totalAmount,
    items: r.SaleReturnItems.map(i => ({
      productId: i.Product.id,
      productName: i.Product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total
    }))
  }));

  res.status(200).json({ status: 1, data });
});

/**
 * 6️⃣ Customer Sales Summary (Top Customers)
 */
exports.topCustomers = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const customers = await Customer.findAll({
    include: [{ model: Sale, where: { saleDate: getDateFilter(startDate, endDate) }, required: false }]
  });

  const report = customers.map(c => {
    const totalAmount = c.Sales.reduce((sum, s) => sum + s.totalAmount, 0);
    return { customerId: c.id, name: c.name, totalSales: c.Sales.length, totalAmount };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  res.status(200).json({ status: 1, data: report });
});