const { StockTransfer, Stock, StockTransaction, Warehouse, Product, User, sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

/**
 * CREATE STOCK TRANSFER
 */
exports.createStockTransfer = catchAsync(async (req, res, next) => {
  const { fromWarehouseId, toWarehouseId, productId, userId, quantity, note } = req.body;
  const businessId = getBusinessId();
  const qty = Number(quantity);
  const fromId = Number(fromWarehouseId);
  const toId = Number(toWarehouseId);
  const productIdNum = Number(productId);
  const resolvedUserId = Number(userId || req.user?.id || 1);

  if (!fromId || !toId || !productIdNum || !qty || !resolvedUserId) {
    return next(new AppError('Missing required fields', 400));
  }

  if (fromId === toId) {
    return next(new AppError('Source and destination warehouse must be different', 400));
  }

  if (qty <= 0) {
    return next(new AppError('Quantity must be positive', 400));
  }

  const [fromWarehouse, toWarehouse, product, user] = await Promise.all([
    Warehouse.findByPk(fromId),
    Warehouse.findByPk(toId),
    Product.findByPk(productIdNum),
    User.findByPk(resolvedUserId),
  ]);

  if (!fromWarehouse || !toWarehouse) {
    return next(new AppError('Invalid warehouse selected', 400));
  }
  if (!product) {
    return next(new AppError('Invalid product selected', 400));
  }
  if (!user) {
    return next(new AppError('Invalid user selected', 400));
  }

  const transfer = await sequelize.transaction(async (t) => {
    const sourceStock = await Stock.findOne({
      where: { businessId, warehouseId: fromId, productId: productIdNum },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const sourceQty = Number(sourceStock?.quantity || 0);
    if (sourceQty < qty) {
      throw new AppError('Insufficient stock in source warehouse', 400);
    }

    sourceStock.quantity = sourceQty - qty;
    await sourceStock.save({ transaction: t });

    const [destinationStock] = await Stock.findOrCreate({
      where: { businessId, warehouseId: toId, productId: productIdNum },
      defaults: { quantity: 0, stockAlert: 0, description: null },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    destinationStock.quantity = Number(destinationStock.quantity || 0) + qty;
    await destinationStock.save({ transaction: t });

    const createdTransfer = await StockTransfer.create({
      businessId,
      fromWarehouseId: fromId,
      toWarehouseId: toId,
      productId: productIdNum,
      userId: resolvedUserId,
      quantity: qty,
      note: note || null,
    }, { transaction: t });

    await StockTransaction.bulkCreate([
      {
        businessId,
        warehouseId: fromId,
        productId: productIdNum,
        type: 'TRANSFER',
        quantity: -qty,
        referenceType: 'TRANSFER',
        referenceId: createdTransfer.id,
        performedBy: resolvedUserId,
        note: note || `Transfer OUT to warehouse ${toId}`,
      },
      {
        businessId,
        warehouseId: toId,
        productId: productIdNum,
        type: 'TRANSFER',
        quantity: qty,
        referenceType: 'TRANSFER',
        referenceId: createdTransfer.id,
        performedBy: resolvedUserId,
        note: note || `Transfer IN from warehouse ${fromId}`,
      }
    ], { transaction: t });

    return createdTransfer;
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
      { model: Product, as: 'product' },
      { model: User, as: 'user' },
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
      { model: Product, as: 'product' },
      { model: User, as: 'user' },
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

  await sequelize.transaction(async (t) => {
    const fromStock = await Stock.findOne({
      where: {
        businessId: transfer.businessId,
        warehouseId: transfer.fromWarehouseId,
        productId: transfer.productId,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const toStock = await Stock.findOne({
      where: {
        businessId: transfer.businessId,
        warehouseId: transfer.toWarehouseId,
        productId: transfer.productId,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const transferableBack = Number(transfer.quantity || 0);
    const currentToQty = Number(toStock?.quantity || 0);
    if (!toStock || currentToQty < transferableBack) {
      throw new AppError('Cannot revert transfer: destination warehouse stock is insufficient', 400);
    }

    toStock.quantity = currentToQty - transferableBack;
    await toStock.save({ transaction: t });

    if (fromStock) {
      fromStock.quantity = Number(fromStock.quantity || 0) + transferableBack;
      await fromStock.save({ transaction: t });
    } else {
      await Stock.create({
        businessId: transfer.businessId,
        warehouseId: transfer.fromWarehouseId,
        productId: transfer.productId,
        quantity: transferableBack,
        stockAlert: 0,
        description: 'Created while reverting stock transfer',
      }, { transaction: t });
    }

    await StockTransaction.bulkCreate([
      {
        businessId: transfer.businessId,
        warehouseId: transfer.fromWarehouseId,
        productId: transfer.productId,
        type: 'ADJUST',
        quantity: transferableBack,
        referenceType: 'TRANSFER',
        referenceId: transfer.id,
        performedBy: transfer.userId || null,
        note: 'Revert transfer OUT',
      },
      {
        businessId: transfer.businessId,
        warehouseId: transfer.toWarehouseId,
        productId: transfer.productId,
        type: 'ADJUST',
        quantity: -transferableBack,
        referenceType: 'TRANSFER',
        referenceId: transfer.id,
        performedBy: transfer.userId || null,
        note: 'Revert transfer IN',
      },
    ], { transaction: t });

    await transfer.destroy({ transaction: t });
  });

  res.status(200).json({
    status: 1,
    message: 'Stock transfer deleted and reverted successfully',
  });
});
