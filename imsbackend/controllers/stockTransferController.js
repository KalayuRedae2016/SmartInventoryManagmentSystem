const { StockTransfer, Stock, Warehouse, Product, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

/**
 * CREATE STOCK TRANSFER
 */
exports.createStockTransfer = catchAsync(async (req, res, next) => {
  const { fromWarehouseId, toWarehouseId, productId, userId, quantity, note } = req.body;
  const businessId = getBusinessId();

  if (!fromWarehouseId || !toWarehouseId || !productId || !userId || !quantity) {
    return next(new AppError('Missing required fields', 400));
  }

  if (fromWarehouseId === toWarehouseId) {
    return next(new AppError('Source and destination warehouse must be different', 400));
  }

  if (quantity <= 0) {
    return next(new AppError('Quantity must be positive', 400));
  }

  // Check if source warehouse has enough stock
  const currentStock = await Stock.sum('quantity', {
    where: { businessId, warehouseId: fromWarehouseId, productId },
  }) || 0;

  if (currentStock < quantity) {
    return next(new AppError('Insufficient stock in source warehouse', 400));
  }

  // Create StockTransfer record
  const transfer = await StockTransfer.create({
    businessId,
    fromWarehouseId,
    toWarehouseId,
    productId,
    userId,
    quantity,
    note,
  });

  // Update Stock table
  // Out from source warehouse
  await Stock.create({
    businessId,
    warehouseId: fromWarehouseId,
    productId,
    quantity: -quantity,
    type: 'TRANSFER',
    referenceId: transfer.id,
    note: note || `Transfer to warehouse ${toWarehouseId}`,
  });

  // In to destination warehouse
  await Stock.create({
    businessId,
    warehouseId: toWarehouseId,
    productId,
    quantity: quantity,
    type: 'TRANSFER',
    referenceId: transfer.id,
    note: note || `Transfer from warehouse ${fromWarehouseId}`,
  });

  res.status(201).json({
    status: 1,
    message: 'Stock transfer completed successfully',
    data: transfer,
  });
});

/**
 * GET STOCK TRANSFERS
 */
exports.getStockTransfers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, fromWarehouseId, toWarehouseId, productId, userId } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
  if (toWarehouseId) where.toWarehouseId = toWarehouseId;
  if (productId) where.productId = productId;
  if (userId) where.userId = userId;

  const transfers = await StockTransfer.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'fromWarehouse' },
      { model: Warehouse, as: 'toWarehouse' },
      Product,
      User,
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: transfers.count,
    data: transfers.rows,
  });
});

/**
 * GET STOCK TRANSFER BY ID
 */
exports.getStockTransferById = catchAsync(async (req, res, next) => {
  const transfer = await StockTransfer.findByPk(req.params.id, {
    include: [
      { model: Warehouse, as: 'fromWarehouse' },
      { model: Warehouse, as: 'toWarehouse' },
      Product,
      User,
    ],
  });

  if (!transfer) return next(new AppError('Stock transfer not found', 404));

  res.status(200).json({
    status: 1,
    data: transfer,
  });
});

/**
 * DELETE STOCK TRANSFER
 * Revert stock changes
 */
exports.deleteStockTransfer = catchAsync(async (req, res, next) => {
  const transfer = await StockTransfer.findByPk(req.params.id);
  if (!transfer) return next(new AppError('Stock transfer not found', 404));

  // Revert stock
  await Stock.create({
    businessId: transfer.businessId,
    warehouseId: transfer.fromWarehouseId,
    productId: transfer.productId,
    quantity: transfer.quantity,
    type: 'ADJUST',
    referenceId: transfer.id,
    note: 'Revert transfer OUT',
  });

  await Stock.create({
    businessId: transfer.businessId,
    warehouseId: transfer.toWarehouseId,
    productId: transfer.productId,
    quantity: -transfer.quantity,
    type: 'ADJUST',
    referenceId: transfer.id,
    note: 'Revert transfer IN',
  });

  await transfer.destroy();

  res.status(200).json({
    status: 1,
    message: 'Stock transfer deleted and reverted successfully',
  });
});
