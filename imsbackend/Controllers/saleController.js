const { Sale, SaleItem, Product, Customer, User, Stock } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const getBusinessId = () => 1;

// Calculate remaining due amount and status
const calculateSaleStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

/**
 * CREATE SALE
 */
exports.createSale = catchAsync(async (req, res, next) => {
  const { warehouseId, customerId, invoiceNumber, saleDate, paymentMethod, items = [] } = req.body;
  const businessId = getBusinessId();

  if (!warehouseId || !customerId || !invoiceNumber || !saleDate) {
    return next(new AppError('Missing required fields', 400));
  }

  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('Sale items are required', 400));
  }

  let totalAmount = 0;
  for (const i of items) {
    if (!i.productId || !i.quantity || !i.unitPrice) {
      return next(new AppError('Invalid sale item fields', 400));
    }
    if (i.quantity <= 0 || i.unitPrice <= 0) {
      return next(new AppError('Quantity and unitPrice must be positive', 400));
    }
    totalAmount += i.quantity * i.unitPrice;
  }

  const sale = await Sale.create({
    businessId,
    warehouseId,
    customerId,
    invoiceNumber,
    saleDate,
    totalAmount,
    paymentMethod,
    status: false, // unpaid by default
    due: totalAmount,
  });

  // Create SaleItems
  for (const i of items) {
    await SaleItem.create({
      saleId: sale.id,
      businessId,
      warehouseId,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.quantity * i.unitPrice,
    });

    // Update Stock (OUT)
    await Stock.create({
      businessId,
      warehouseId,
      productId: i.productId,
      quantity: i.quantity,
      type: 'OUT',
      referenceId: sale.id,
      note: `Sale ${sale.invoiceNumber}`,
    });
  }

  res.status(201).json({
    status: 1,
    message: 'Sale created successfully',
    data: sale,
  });
});

/**
 * GET SALES
 */
exports.getSales = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, customerId, status } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (customerId) where.customerId = customerId;
  if (status !== undefined) where.status = status;

  const sales = await Sale.findAndCountAll({
    where,
    include: [Customer, User],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['saleDate', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: sales.count,
    data: sales.rows,
  });
});

/**
 * GET SALE BY ID
 */
exports.getSaleById = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [
      Customer,
      User,
      { model: SaleItem, include: [Product] }
    ]
  });

  if (!sale) return next(new AppError('Sale not found', 404));

  res.status(200).json({
    status: 1,
    data: sale,
  });
});

/**
 * UPDATE SALE
 * Only allowed if sale not fully paid
 */
exports.updateSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return next(new AppError('Sale not found', 404));

  if (sale.status) return next(new AppError('Cannot update a paid sale', 400));

  const { customerId, warehouseId, paymentMethod, saleDate } = req.body;
  if (customerId) sale.customerId = customerId;
  if (warehouseId) sale.warehouseId = warehouseId;
  if (paymentMethod) sale.paymentMethod = paymentMethod;
  if (saleDate) sale.saleDate = saleDate;

  await sale.save();

  res.status(200).json({
    status: 1,
    message: 'Sale updated successfully',
    data: sale,
  });
});

/**
 * DELETE SALE
 * Only allowed if not paid
 */
exports.deleteSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return next(new AppError('Sale not found', 404));
  if (sale.status) return next(new AppError('Cannot delete a paid sale', 400));

  // Revert stock
  const saleItems = await SaleItem.findAll({ where: { saleId: sale.id } });
  for (const item of saleItems) {
    await Stock.create({
      businessId: sale.businessId,
      warehouseId: sale.warehouseId,
      productId: item.productId,
      quantity: item.quantity,
      type: 'ADJUST',
      referenceId: sale.id,
      note: `Sale deletion revert`,
    });
    await item.destroy();
  }

  await sale.destroy();

  res.status(200).json({
    status: 1,
    message: 'Sale deleted successfully',
  });
});

/**
 * ADD / UPDATE / DELETE SaleItems handled separately
 * Logic: Only allow changes if sale not finalized (not paid)
 * Stock adjustments automatically
 */
