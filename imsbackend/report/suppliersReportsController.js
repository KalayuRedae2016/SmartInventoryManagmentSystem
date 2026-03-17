const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getDateFilter } = require('../utils/reportHelpers');

const Supplier = db.Supplier;
const Purchase = db.Purchase;
const PurchaseReturn = db.PurchaseReturn;
const PurchaseReturnItem = db.PurchaseReturnItem;

// Supplier Summary
exports.getSupplierSummary = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const suppliers = await Supplier.findAll({
    include: [
      {
        model: Purchase,
        required: false,
        where: { createdAt: getDateFilter(startDate, endDate) },
        include: [{ model: PurchaseReturn, include: [PurchaseReturnItem] }]
      }
    ]
  });

  const summary = suppliers.map(s => {
    const totalPurchases = s.Purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPurchaseReturns = s.Purchases.reduce((sum, p) =>
      sum + p.PurchaseReturns.reduce((rSum, r) => rSum + r.totalAmount, 0), 0
    );
    const paidAmount = s.Purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const dueAmount = totalPurchases - paidAmount;

    return {
      supplierId: s.id,
      name: s.name,
      phone: s.phone,
      totalPurchases,
      totalPurchaseReturns,
      paidAmount,
      dueAmount
    };
  }).sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, top);

  res.status(200).json({ status: 1, data: summary });
});

// Supplier Detailed Report
exports.getSupplierDetail = catchAsync(async (req, res) => {
  const { supplierId, startDate, endDate } = req.query;

  const where = {};
  if (supplierId) where.id = supplierId;

  const suppliers = await Supplier.findAll({
    where,
    include: [
      {
        model: Purchase,
        include: [
          {
            model: PurchaseReturn,
            include: [PurchaseReturnItem]
          }
        ],
        required: false,
        where: { createdAt: getDateFilter(startDate, endDate) }
      }
    ]
  });

  const details = suppliers.map(s => ({
    supplierId: s.id,
    name: s.name,
    phone: s.phone,
    purchases: s.Purchases.map(p => ({
      purchaseId: p.id,
      totalAmount: p.totalAmount,
      paidAmount: p.paidAmount,
      dueAmount: p.totalAmount - p.paidAmount,
      status: p.status,
      purchaseReturns: p.PurchaseReturns.map(r => ({
        id: r.id,
        totalAmount: r.totalAmount,
        reason: r.reason,
        items: r.PurchaseReturnItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          total: i.total
        }))
      }))
    }))
  }));

  res.status(200).json({ status: 1, data: details });
});