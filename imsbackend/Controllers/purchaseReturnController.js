const { PurchaseReturn, PurchaseReturnItem, Purchase, Supplier, Warehouse, Stock, Product } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

// Helper: calculate remaining returnable amount for a purchase
const getRemainingReturnAmount = async (purchaseId) => {
  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase) return 0;

  const returnedTotal = await PurchaseReturnItem.sum('total', {
    include: [{
      model: PurchaseReturn,
      where: { purchaseId, status: 'completed', isActive: true }
    }]
  }) || 0;

  return purchase.totalAmount - returnedTotal;
};


exports.createPurchaseReturn = catchAsync(async (req, res, next) => {
  const { purchaseId, warehouseId, supplierId, totalAmount, reason } = req.body;
  const businessId = getBusinessId();

  if (!purchaseId || !warehouseId || !supplierId || !totalAmount || !reason) {
    return next(new AppError('Missing required fields', 400));
  }

  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive) {
    return next(new AppError('Purchase not found', 404));
  }

  // Prevent return exceeding purchase remaining amount
  const remaining = await getRemainingReturnAmount(purchaseId);
  if (totalAmount > remaining) {
    return next(new AppError(`Return amount cannot exceed remaining purchase amount (${remaining})`, 400));
  }

  const purchaseReturn = await PurchaseReturn.create({
    purchaseId,
    businessId,
    warehouseId,
    supplierId,
    totalAmount,
    reason,
    status: 'pending',
    isActive: true,
  });

  res.status(201).json({
    status: 1,
    message: 'Purchase return created successfully',
    data: purchaseReturn,
  });
});

exports.getPurchaseReturns = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const businessId = getBusinessId();

  const where = { businessId, isActive: true };
  if (status) where.status = status;

  const purchaseReturns = await PurchaseReturn.findAndCountAll({
    where,
    include: [
      { model: Purchase, as: 'purchase' },
      { model: Supplier, as: 'supplier' },
      { model: Warehouse, as: 'warehouse' },
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase returns fetched successfully',
    total: purchaseReturns.count,
    data: purchaseReturns.rows,
  });
});

exports.getPurchaseReturnById = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.id, {
    include: [
      { model: Purchase, as: 'purchase' },
      { model: Supplier, as: 'supplier' },
      { model: Warehouse, as: 'warehouse' },
      //{ model: PurchaseReturnItem, include: [{ model: Product, as: 'product' }] }
    ],
  });

  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Purchase return fetched successfully',
    data: purchaseReturn,
  });
});

exports.updatePurchaseReturn = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.id);
  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Completed returns cannot be modified', 400));
  }

  const { warehouseId, supplierId, totalAmount, reason, status } = req.body;

  if (warehouseId !== undefined) purchaseReturn.warehouseId = warehouseId;
  if (supplierId !== undefined) purchaseReturn.supplierId = supplierId;
  if (reason !== undefined) purchaseReturn.reason = reason;

  if (totalAmount !== undefined) {
    const remaining = await getRemainingReturnAmount(purchaseReturn.purchaseId);
    if (totalAmount > remaining) {
      return next(new AppError(`Return amount cannot exceed remaining purchase amount (${remaining})`, 400));
    }
    purchaseReturn.totalAmount = totalAmount;
  }

  if (status !== undefined) purchaseReturn.status = status;

  await purchaseReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase return updated successfully',
    data: purchaseReturn,
  });
});

exports.deletePurchaseReturn = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.id);
  if (!purchaseReturn || !purchaseReturn.isActive) return next(new AppError('Purchase return not found', 404));

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Completed returns cannot be deleted', 400));
  }

  purchaseReturn.isActive = false;
  await purchaseReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase return deleted successfully',
  });
});

exports.createPurchaseReturnItem = catchAsync(async (req, res, next) => {
  const { purchaseReturnId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!purchaseReturnId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Invalid quantity or unit price', 400));
  }

  const purchaseReturn = await PurchaseReturn.findByPk(purchaseReturnId);
  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Cannot add items to a completed return', 400));
  }

  const itemTotal = quantity * unitPrice;

  // Prevent exceeding remaining purchase amount
  const remaining = await getRemainingReturnAmount(purchaseReturn.purchaseId);
  if (itemTotal > remaining) {
    return next(new AppError(`Item total (${itemTotal}) exceeds remaining purchase amount (${remaining})`, 400));
  }

  const item = await PurchaseReturnItem.create({
    purchaseReturnId,
    businessId,
    warehouseId,
    productId,
    quantity,
    unitPrice,
    total: itemTotal,
  });

  res.status(201).json({
    status: 1,
    message: 'Purchase return item added successfully',
    data: item,
  });
});

exports.getPurchaseReturnItems = catchAsync(async (req, res) => {
  const { purchaseReturnId, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (purchaseReturnId) where.purchaseReturnId = purchaseReturnId;

  const items = await PurchaseReturnItem.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product' }],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase return items fetched successfully',
    result: items.count,
    data: items.rows,
  });
});

exports.updatePurchaseReturnItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase return item not found', 404));

  const purchaseReturn = await PurchaseReturn.findByPk(item.purchaseReturnId);
  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Cannot modify items of a completed return', 400));
  }

  const { quantity, unitPrice } = req.body;

  if (quantity !== undefined && quantity <= 0) return next(new AppError('Invalid quantity', 400));
  if (unitPrice !== undefined && unitPrice <= 0) return next(new AppError('Invalid unit price', 400));

  item.quantity = quantity !== undefined ? quantity : item.quantity;
  item.unitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
  item.total = item.quantity * item.unitPrice;

  await item.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase return item updated successfully',
    data: item,
  });
});

exports.deletePurchaseReturnItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase return item not found', 404));

  const purchaseReturn = await PurchaseReturn.findByPk(item.purchaseReturnId);
  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Cannot delete items of a completed return', 400));
  }

  await item.destroy();

  res.status(200).json({
    status: 1,
    message: 'Purchase return item deleted successfully',
  });
});
