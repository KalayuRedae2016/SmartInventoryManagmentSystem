'use strict';

const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const {Sale,SaleItem,SaleReturn,SaleReturnItem,Customer,Warehouse,Product,User} = require('../models');


const buildFilters = ({ startDate, endDate, warehouseId, customerId, status }) => {
  const where = {};

  if (startDate && endDate) {
    where.saleDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  if (warehouseId) where.warehouseId = warehouseId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  return where;
};

exports.salesSummary = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const result = await Sale.findAll({
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalInvoices'],
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSales'],
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

exports.salesDetailed = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const sales = await Sale.findAll({
    where,
    include: [
      { model: Customer,as:"customer", attributes: ['id', 'name'] },
      { model: Warehouse,as:"warehouse",attributes: ['id', 'name'] }
    ],
    order: [['saleDate', 'DESC']]
  });

  
  const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDue = sales.reduce((sum, s) => sum + s.dueAmount, 0);

  res.status(200).json({
    status: 1,
    summary: {
      totalRecords: sales.length,
      totalAmount,
      totalPaid,
      totalDue
    },
    data: sales
  });
});

exports.salesByProduct = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await SaleItem.findAll({
    include: [
      { model: Sale,as:"sale", where, attributes: [] },
      { model: Product,as:"product", attributes: ['id', 'name',] }
    ],
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQty'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'totalSales']
    ],
    group: ['productId', 'Product.id'],
    order: [[Sequelize.literal('totalSales'), 'DESC']]
  });

  
  const totalRevenue = results.reduce(
    (sum, r) => sum + Number(r.get('totalSales') || 0),
    0
  );

  res.status(200).json({
    status: 1,
    summary: {
      totalProducts: results.length,
      totalRevenue
    },
    data: results
  });
});

exports.salesByCustomer = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Sale.findAll({
    where,
    attributes: [
      'customerId',
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSpent']
    ],
    include: [{ model: Customer,as:"customer", attributes: ['name'] }],
    group: ['customerId', 'Customer.id'],
    order: [[Sequelize.literal('totalSpent'), 'DESC']]
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

exports.salesByStatus = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Sale.findAll({
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

exports.topProducts = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await SaleItem.findAll({
    include: [
      { model: Sale,as:"sale", where, attributes: [] },
      { model: Product,as:"product", attributes: ['name'] }
    ],
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']
    ],
    group: ['productId', 'Product.id'],
    order: [[Sequelize.literal('totalSold'), 'DESC']],
    limit: 10
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

exports.topCustomers = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Sale.findAll({
    where,
    attributes: [
      'customerId',
      [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSpent']
    ],
    include: [{ model: Customer,as:"customer", attributes: ['name'] }],
    group: ['customerId', 'Customer.id'],
    order: [[Sequelize.literal('totalSpent'), 'DESC']],
    limit: 10
  });

  res.status(200).json({
    status: 1,
    data: results
  });
});

exports.salesReturns = catchAsync(async (req, res) => {
  const where = {};

  if (req.query.startDate && req.query.endDate) {
    where.returnDate = {
      [Op.between]: [
        new Date(req.query.startDate),
        new Date(req.query.endDate)
      ]
    };
  }

  const result = await SaleReturn.findAll({
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

exports.salesByPaymentMethod = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const results = await Sale.findAll({
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