'use strict';

const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');

const {
  Purchase,
  PurchaseItem,
  PurchaseReturn,
  Supplier,
  Warehouse,
  Product,
  User
} = require('../models');

/**
 * 🔹 COMMON FILTER BUILDER
 */
const buildFilters = ({ startDate, endDate, warehouseId, supplierId, status }) => {
  const where = {};

  if (startDate && endDate) {
    where.purchaseDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  if (warehouseId) where.warehouseId = warehouseId;
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  return where;
};

/**
 * 🔹 PURCHASE SUMMARY
 */
exports.purchaseSummary = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const result = await Purchase.findAll({
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalInvoices'],
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalPurchase'],
      [Sequelize.fn('SUM', Sequelize.col('paidAmount')), 'totalPaid'],
      [Sequelize.fn('SUM', Sequelize.col('dueAmount')), 'totalDue']
    ],
    where,
    raw: true
  });

  res.status(200).json({
    status: 1,
    data: result[0]
  });
});

/**
 * 🔹 PURCHASE DETAILED
 */
exports.purchaseDetailed = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const purchases = await Purchase.findAll({
    where,
    include: [
      { model: Supplier,as:"supplier",attributes: ['id', 'name'] },
      { model: Warehouse, as:"warehouse",attributes: ['id', 'name'] },
      { model: PurchaseItem,as:"items", include: [{ model: Product,as:"product",attributes: ['id', 'name',] }] }
    ],
    
  });

  const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = purchases.reduce((sum, p) => sum + p.dueAmount, 0);

  res.status(200).json({
    status: 1,
    summary: {
      totalRecords: purchases.length,
      totalAmount,
      totalPaid,
      totalDue
    },
    data: purchases
  });
});

/**
 * 🔹 PURCHASE BY PRODUCT
 */
exports.purchaseByProduct = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await PurchaseItem.findAll({
    include: [
      { model: Purchase,as:"purchase", where, attributes: [] },
      { model: Product, as:"product",attributes: ['id', 'name'] }
    ],
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQty'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'totalPurchase']
    ],
    group: ['productId', 'Product.id'],
    order: [[Sequelize.literal('totalPurchase'), 'DESC']]
  });

  const totalPurchase = results.reduce(
    (sum, r) => sum + Number(r.get('totalPurchase') || 0),
    0
  );

  res.status(200).json({
    status: 1,
    summary: {
      totalProducts: results.length,
      totalPurchase
    },
    data: results
  });
});

/**
 * 🔹 PURCHASE BY SUPPLIER
 */
exports.purchaseBySupplier = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Purchase.findAll({
    where,
    attributes: [
      'supplierId',
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalPurchase']
    ],
    include: [{ model: Supplier,as:"supplier", attributes: ['name'] }],
    group: ['supplierId', 'Supplier.id'],
    order: [[Sequelize.literal('totalPurchase'), 'DESC']]
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

/**
 * 🔹 PURCHASE BY STATUS
 */
exports.purchaseByStatus = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Purchase.findAll({
    where,
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'total']
    ],
    group: ['status']
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

/**
 * 🔹 TOP SUPPLIERS
 */
exports.topSuppliers = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Purchase.findAll({
    where,
    attributes: [
      'supplierId',
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalPurchase']
    ],
    include: [{ model: Supplier,as:"supplier", attributes: ['name'] }],
    group: ['supplierId', 'Supplier.id'],
    order: [[Sequelize.literal('totalPurchase'), 'DESC']],
    limit: 10
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

/**
 * 🔹 PURCHASE RETURNS
 */
exports.purchaseReturns = catchAsync(async (req, res) => {
  const where = {};

  if (req.query.startDate && req.query.endDate) {
    where.returnDate = {
      [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
    };
  }

  const result = await PurchaseReturn.findAll({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalReturns'],
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalReturned']
    ],
    raw: true
  });

  res.status(200).json({
    status: 1,
    data: result[0]
  });
});

/**
 * 🔹 PAYMENT METHODS
 */
exports.purchaseByPaymentMethod = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Purchase.findAll({
    where,
    attributes: [
      'paymentMethod',
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'total']
    ],
    group: ['paymentMethod']
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});