const { Op, Sequelize } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const {Customer,Sale,SaleItem,SaleReturn,SaleReturnItem} = require("../models")

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  return null;
};

exports.customerPurchaseHistory = catchAsync(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const where = {};
  if (customerId) where.customerId = customerId;

  if (startDate && endDate) {
    where.saleDate = buildDateFilter(startDate, endDate);
  }

  const sales = await Sale.findAll({
    where,
    include: [
      {model: Customer,as:"customer",attributes: ['id', 'name', 'phone']},
      {model: SaleItem,as:"items"},
      
    ],
    order: [['saleDate', 'DESC']]
  });

  res.status(200).json({
    status: 1,
    count: sales.length,
    data: sales
  });
});

exports.customerPaymentReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = buildDateFilter(startDate, endDate);

  const customers = await Customer.findAll({
    include: [{
      model: Sale,
      as: 'sales',
      required: false,
      where
    }]
  });

  const data = customers.map(c => {
    const sales = c.sales || [];

    return {
      customerId: c.id,
      name: c.name,
      totalPurchases: sales.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalPaid: sales.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalDue: sales.reduce((sum, p) => sum + (p.dueAmount || 0), 0)
    };
  });

  res.status(200).json({
    status: 1,
    data
  });
});


exports.customerDueReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.saleDate = buildDateFilter(startDate, endDate);
  }

  const customers = await Customer.findAll({
    include: [{
      model: Sale,as:"sales",
      required: false,
      where
    }]
  });

  const data = customers.map(c => {
    const totalDue = (c.Sales || []).reduce((sum, c) => sum + (s.due || 0),0);

    return {
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      totalDue
    };
  }).filter(c => c.totalDue > 0);

  res.status(200).json({
    status: 1,
    count: data.length,
    data
  });
});

exports.topCustomers = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.saleDate = buildDateFilter(startDate, endDate);
  }

  const customers = await Customer.findAll({
    include: [{
      model: Sale,as:"sales",
      required: false,
      where
    }]
  });

  const data = customers.map(c => {
    const sales = c.Sales || [];

    return {
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      totalInvoices: sales.length,
      totalAmount: sales.reduce((s, x) => s + (x.totalAmount || 0), 0)
    };
  })
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, parseInt(top));

  res.status(200).json({
    status: 1,
    count: data.length,
    data
  });
});

exports.customerReturnReport = catchAsync(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const where = {};
  if (customerId) where.customerId = customerId;

  if (startDate && endDate) {
    where.returnDate = buildDateFilter(startDate, endDate);
  }

  const returns = await SaleReturn.findAll({
    where,
    include: [
      {
        model: Customer,as:"customer",
        attributes: ['id', 'name', 'phone']
      },
      {
        model: SaleReturnItem,as:"items"
      }
    ],
    order: [['returnDate', 'DESC']]
  });

  const totalReturnedAmount = returns.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  res.status(200).json({
    status: 1,
    count: returns.length,
    summary: {
      totalReturnedAmount
    },
    data: returns
  });
});
