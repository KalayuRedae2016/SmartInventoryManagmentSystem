const { SaleReturn, SaleReturnItem, Sale, Product, Customer, Stock } = require('../models');
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
 * CREATE SALE RETURN
 */
exports.createSaleReturn = catchAsync(async (req, res, next) => {
  const { saleId, warehouseId, customerId, totalAmount, paymentMethod, items = [] } = req.body;
  const businessId = getBusinessId();

  if (!saleId || !warehouseId || !customerId || !totalAmount || !items.length) {
    return next(new AppError('Missing required fields', 400));
  }

  const sale = await Sale.findByPk(saleId, { include: [SaleItem] });
  if (!sale) return next(new AppError('Original sale not found', 404));

  const saleTotal = sale.totalAmount;
  if (totalAmount > saleTotal) {
    return next(new AppError('Return total cannot exceed sale total', 400));
  }

  const saleReturn = await SaleReturn.create({
    saleId,
    businessId,
    warehouseId,
    customerId,
    totalAmount,
    status: false, // pending
    paymentMethod,
    returnDate: new Date(),
  });

  for (const i of items) {
    if (!i.productId || !i.quantity || !i.unitPrice) {
      return next(new AppError('Invalid sale return item fields', 400));
    }

    const soldItem = sale.SaleItems.find(si => si.productId === i.productId);
    if (!soldItem) return next(new AppError('Cannot return product not in original sale', 400));
    if (i.quantity > soldItem.quantity) return next(new AppError('Return quantity exceeds sold quantity', 400));

    const total = i.quantity * i.unitPrice;
    await SaleReturnItem.create({
      saleReturnId: saleReturn.id,
      businessId,
      warehouseId,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total,
    });

    // Update stock (IN)
    await Stock.create({
      businessId,
      warehouseId,
      productId: i.productId,
      quantity: i.quantity,
      type: 'IN',
      referenceId: saleReturn.id,
      note: `Sale return ${saleReturn.id}`,
    });
  }

  res.status(201).json({
    status: 1,
    message: 'Sale return created successfully',
    data: saleReturn,
  });
});

/**
 * GET SALE RETURNS
 */
exports.getSaleReturns = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (status !== undefined) where.status = status;

  const saleReturns = await SaleReturn.findAndCountAll({
    where,
    include: [
      Sale,
      Customer,
      { model: SaleReturnItem, include: [Product] }
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['returnDate', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: saleReturns.count,
    data: saleReturns.rows,
  });
});

/**
 * UPDATE SALE RETURN
 * Only allowed if not completed
 */
exports.updateSaleReturn = catchAsync(async (req, res, next) => {
  const saleReturn = await SaleReturn.findByPk(req.params.id);
  if (!saleReturn) return next(new AppError('Sale return not found', 404));
  if (saleReturn.status) return next(new AppError('Cannot modify completed return', 400));

  const { warehouseId, customerId, totalAmount, paymentMethod } = req.body;
  if (warehouseId) saleReturn.warehouseId = warehouseId;
  if (customerId) saleReturn.customerId = customerId;
  if (totalAmount) saleReturn.totalAmount = totalAmount;
  if (paymentMethod) saleReturn.paymentMethod = paymentMethod;

  await saleReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Sale return updated successfully',
    data: saleReturn,
  });
});

/**
 * DELETE SALE RETURN
 * Only allowed if not completed
 * Stock rollback included
 */
exports.deleteSaleReturn = catchAsync(async (req, res, next) => {
  const saleReturn = await SaleReturn.findByPk(req.params.id, { include: [SaleReturnItem] });
  if (!saleReturn) return next(new AppError('Sale return not found', 404));
  if (saleReturn.status) return next(new AppError('Cannot delete completed return', 400));

  // Rollback stock
  for (const item of saleReturn.SaleReturnItems) {
    await Stock.create({
      businessId: saleReturn.businessId,
      warehouseId: saleReturn.warehouseId,
      productId: item.productId,
      quantity: item.quantity,
      type: 'ADJUST',
      referenceId: saleReturn.id,
      note: `Return deletion rollback`,
    });
    await item.destroy();
  }

  await saleReturn.destroy();

  res.status(200).json({
    status: 1,
    message: 'Sale return deleted successfully',
  });
});
