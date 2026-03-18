'use strict';
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');

const {Supplier,Purchase,PurchaseItem,PurchaseReturn,PurchaseReturnItem} = require('../models');

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
};

exports.supplierPurchaseHistory = catchAsync(async (req, res) => {
  const { supplierId, startDate, endDate } = req.query;

  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (startDate && endDate) where.createdAt = buildDateFilter(startDate, endDate);

  const purchases = await Purchase.findAll({
    where,
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'phone']
      },
      {
        model: PurchaseItem,
        as: 'items'
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 1,
    count: purchases.length,
    data: purchases
  });
});

exports.supplierPaymentReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = buildDateFilter(startDate, endDate);

  const suppliers = await Supplier.findAll({
    include: [{
      model: Purchase,
      as: 'purchases',
      required: false,
      where
    }]
  });

  const data = suppliers.map(s => {
    const purchases = s.purchases || [];

    return {
      supplierId: s.id,
      name: s.name,
      totalPurchases: purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalPaid: purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalDue: purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0)
    };
  });

  res.status(200).json({
    status: 1,
    data
  });
});

exports.supplierDueReport = catchAsync(async (req, res) => {

  const suppliers = await Supplier.findAll({
    attributes: ['id', 'name', 'phone', 'totalPurchaseDue']
  });

  const data = suppliers
    .map(s => ({
      supplierId: s.id,
      name: s.name,
      phone: s.phone,
      totalDue: s.totalPurchaseDue
    }))
    .filter(s => s.totalDue > 0);

  res.status(200).json({
    status: 1,
    count: data.length,
    data
  });
});

exports.supplierReturnReport = catchAsync(async (req, res) => {
  const { supplierId, startDate, endDate } = req.query;

  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (startDate && endDate) {
    where.createdAt = buildDateFilter(startDate, endDate);
  }

  const returns = await PurchaseReturn.findAll({
    where,
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      },
      {
        model: PurchaseReturnItem,
        as: 'items'
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const totalReturnedAmount = returns.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  res.status(200).json({
    status: 1,
    count: returns.length,
    summary: { totalReturnedAmount },
    data: returns
  });
});

exports.topSuppliers = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.createdAt = buildDateFilter(startDate, endDate);
  }

  const suppliers = await Supplier.findAll({
    include: [{
      model: Purchase,
      as: 'purchases',
      required: false,
      where
    }]
  });

  const data = suppliers.map(s => {
    const purchases = s.purchases || [];

    return {
      supplierId: s.id,
      name: s.name,
      totalAmount: purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
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