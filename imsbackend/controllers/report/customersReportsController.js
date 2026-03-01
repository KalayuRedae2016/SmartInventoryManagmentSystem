const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getDateFilter } = require('../utils/reportHelpers');

const Customer = db.Customer;
const Sale = db.Sale;
const SaleItem = db.SaleItem;

// Customer Summary
exports.getCustomerSummary = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const customers = await Customer.findAll({
    include: [
      {
        model: Sale,
        required: false,
        where: { saleDate: getDateFilter(startDate, endDate) }
      }
    ]
  });

  const summary = customers.map(c => ({
    customerId: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalSales: c.Sales.length,
    totalAmount: c.Sales.reduce((sum, s) => sum + s.totalAmount, 0)
  })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, top);

  res.status(200).json({ status: 1, data: summary });
});

// Customer Detailed Report
exports.getCustomerDetail = catchAsync(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const where = {};
  if (customerId) where.id = customerId;

  const customers = await Customer.findAll({
    where,
    include: [
      {
        model: Sale,
        include: [SaleItem],
        required: false,
        where: { saleDate: getDateFilter(startDate, endDate) }
      }
    ]
  });

  const details = customers.map(c => ({
    customerId: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    sales: c.Sales.map(s => ({
      saleId: s.id,
      invoiceNumber: s.invoiceNumber,
      saleDate: s.saleDate,
      totalAmount: s.totalAmount,
      paid: s.totalAmount - s.due,
      due: s.due,
      items: s.SaleItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.unitPrice,
        total: i.total
      }))
    }))
  }));

  res.status(200).json({ status: 1, data: details });
});