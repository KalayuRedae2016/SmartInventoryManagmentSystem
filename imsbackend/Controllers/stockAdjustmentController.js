const { StockAdjustment, Stock, Warehouse, Product, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

/**
 * CREATE STOCK ADJUSTMENT
 */
exports.createStockAdjustment = catchAsync(async (req, res, next) => {
  const { warehouseId, productId, userId, quantity, adjustmentType, note } = req.body;
  const businessId = getBusinessId();

  if (!warehouseId || !productId || !userId || !quantity || !adjustmentType) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity === 0) return next(new AppError('Quantity cannot be zero', 400));

  const adjustment = await StockAdjustment.create({
    businessId,
    warehouseId,
    productId,
    userId,
    quantity,
    adjustmentType,
    note,
  });

  // Update Stock table
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
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

/**
 * GET STOCK ADJUSTMENTS
 */
exports.getStockAdjustments = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, warehouseId, productId, userId } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (userId) where.userId = userId;

  const adjustments = await StockAdjustment.findAndCountAll({
    where,
    include: [Warehouse, Product, User],
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

/**
 * GET STOCK ADJUSTMENT BY ID
 */
exports.getStockAdjustmentById = catchAsync(async (req, res, next) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id, {
    include: [Warehouse, Product, User],
  });
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  res.status(200).json({
    status: 1,
    data: adjustment,
  });
});

/**
 * UPDATE STOCK ADJUSTMENT
 * Optional: only allow if not finalized or business allows
 */
exports.updateStockAdjustment = catchAsync(async (req, res, next) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id);
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  const { warehouseId, productId, userId, quantity, adjustmentType, note } = req.body;
  if (warehouseId) adjustment.warehouseId = warehouseId;
  if (productId) adjustment.productId = productId;
  if (userId) adjustment.userId = userId;
  if (quantity) adjustment.quantity = quantity;
  if (adjustmentType) adjustment.adjustmentType = adjustmentType;
  if (note) adjustment.note = note;

  await adjustment.save();

  res.status(200).json({
    status: 1,
    message: 'Stock adjustment updated successfully',
    data: adjustment,
  });
});

/**
 * DELETE STOCK ADJUSTMENT
 * Revert stock
 */
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
