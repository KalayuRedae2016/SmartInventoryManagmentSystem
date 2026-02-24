const { StockAdjustment, Stock, Warehouse, Product, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;
const ALLOWED_ADJUSTMENT_TYPES = new Set(['addition', 'subtraction', 'correction', 'damage']);

exports.createStockAdjustment = catchAsync(async (req, res, next) => {
  const { warehouseId, productId, userId, quantity, adjustmentType, note } = req.body;
  const businessId = getBusinessId();

  if (!warehouseId || !productId || !quantity || !adjustmentType) {
    return next(new AppError('Missing required fields', 400));
  }
  if (!ALLOWED_ADJUSTMENT_TYPES.has(String(adjustmentType))) {
    return next(new AppError('Invalid adjustmentType', 400));
  }

  if (Number(quantity) <= 0) return next(new AppError('Quantity must be greater than zero', 400));

  const signedQuantity = ['subtraction', 'damage'].includes(String(adjustmentType))
    ? -Math.abs(Number(quantity))
    : Math.abs(Number(quantity));

  const adjustment = await StockAdjustment.create({
    businessId,
    warehouseId,
    productId,
    userId: Number(userId || 1),
    quantity: signedQuantity,
    adjustmentType,
    note,
  });

  // Update Stock table
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity: signedQuantity,
    type: adjustmentType,
    referenceId: adjustment.id,
    note: note || `Stock adjustment: ${adjustmentType}`,
  });

  res.status(201).json({
    status: 1,
    message: 'Stock adjustment recorded successfully',
    data: adjustment,
  });
});

exports.getStockAdjustments = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, warehouseId, productId, userId } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (userId) where.userId = userId;

  const adjustments = await StockAdjustment.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'warehouse' },
      { model: Product, as: 'product' },
      { model: User, as: 'user' }
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: adjustments.count,
    data: adjustments.rows,
  });
});

exports.getStockAdjustmentById = catchAsync(async (req, res, next) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id, {
    include: [
      { model: Warehouse, as: 'warehouse' },
      { model: Product, as: 'product' },
      { model: User, as: 'user' }
    ],
  });
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  res.status(200).json({
    status: 1,
    data: adjustment,
  });
});

exports.updateStockAdjustment = catchAsync(async (req, res, next) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id);
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  const { warehouseId, productId, userId, quantity, adjustmentType, note } = req.body;
  if (warehouseId) adjustment.warehouseId = warehouseId;
  if (productId) adjustment.productId = productId;
  if (userId) adjustment.userId = userId;
  if (quantity !== undefined) adjustment.quantity = Number(quantity);
  if (adjustmentType) {
    if (!ALLOWED_ADJUSTMENT_TYPES.has(String(adjustmentType))) {
      return next(new AppError('Invalid adjustmentType', 400));
    }
    adjustment.adjustmentType = adjustmentType;
  }
  if (note) adjustment.note = note;

  await adjustment.save();

  res.status(200).json({
    status: 1,
    message: 'Stock adjustment updated successfully',
    data: adjustment,
  });
});

exports.deleteStockAdjustment = catchAsync(async (req, res, next) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id);
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  // Revert stock
  await Stock.create({
    businessId: adjustment.businessId,
    warehouseId: adjustment.warehouseId,
    productId: adjustment.productId,
    quantity: -adjustment.quantity,
    type: 'ADJUST',
    referenceId: adjustment.id,
    note: 'Revert stock adjustment',
  });

  await adjustment.destroy();

  res.status(200).json({
    status: 1,
    message: 'Stock adjustment deleted successfully',
  });
});
