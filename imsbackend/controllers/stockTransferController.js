'use strict';
const { StockTransfer, Stock, Warehouse, Product, User, sequelize} = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const adjustStock = async ({ 
  businessId, warehouseId, productId, quantity, type, referenceId, note }, transaction) => {
  console.log("Adjusted Stock",quantity)
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
    type,
    referenceId,
    note,
  }, { transaction });

  const currentStock = await Stock.sum('quantity', {
    where: { businessId, warehouseId, productId },
  }) || 0;
console.log('addjusted stockqu',currentStock)
};

const buildQuery = (user,query) => {
  const {productId,fromWarehouseId,toWarehouseId,userId,minQuantity,maxQuantity,search,startDate,endDate,} = query;

  let whereQuery = { businessId: user.businessId};

  if(fromWarehouseId) whereQuery.fromWarehouseId=fromWarehouseId
  if(toWarehouseId) whereQuery.toWarehouseId=toWarehouseId
  if(productId) whereQuery.productId=productId
  if(userId) whereQuery.userId=userId

  if(minQuantity||maxQuantity){
    whereQuery.quantity={}
    if (minQuantity) whereQuery.paidAmount[Op.gte] = Number(minQuantity);
    if (maxQuantity) whereQuery.paidAmount[Op.lte] = Number(maxQuantity);
  }

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};

  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereQuery;
};

exports.createStockTransfer = catchAsync(async (req, res, next) => {
  const { fromWarehouseId, toWarehouseId, productId,quantity, note } = req.body;

  const businessId=req.user.businessId
  const userId=req.body.userId||req.user.id

  const qty = Number(quantity);
  const fromId = Number(fromWarehouseId);
  const toId = Number(toWarehouseId);
  const productIdNum = Number(productId);
  const resolvedUserId = Number(userId || req.user?.id || 1);

  if (!fromId || !toId || !productIdNum || !qty || !resolvedUserId) {
    return next(new AppError('Missing required fields', 400));
  }
  if (fromWarehouseId === toWarehouseId) return next(new AppError('Source and destination must differ', 400));
  if (quantity <= 0) return next(new AppError('Quantity must be positive', 400));

  const currentStock = await Stock.sum('quantity', {
    where: { businessId, warehouseId: fromWarehouseId, productId },
  }) || 0;

  console.log("currentStock",currentStock)

  if (currentStock < quantity) return next(new AppError('Insufficient stock in source warehouse', 400));

  const transaction = await sequelize.transaction();
  try {
    const transfer = await StockTransfer.create({
      businessId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      userId,
      quantity,
      note,
    }, { transaction });

    // Out from source
    await adjustStock({
      businessId,
      warehouseId: fromWarehouseId,
      productId,
      quantity: -quantity,
      type: 'TRANSFER',
      referenceId: transfer.id,
      note: note || `Transfer to warehouse ${toWarehouseId}`
    }, transaction);

    // In to destination
    await adjustStock({
      businessId,
      warehouseId: toWarehouseId,
      productId,
      quantity,
      type: 'TRANSFER',
      referenceId: transfer.id,
      note: note || `Transfer from warehouse ${fromWarehouseId}`
    }, transaction);

    await transaction.commit();

    res.status(201).json({
      status: 1,
      message: 'Stock transfer completed successfully',
      data: transfer,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
});

exports.getStockTransfers = catchAsync(async (req, res) => {
  const {page = 1, limit = 10}= req.query;

  const where=buildQuery(req.user,req.query)
  const transfers = await StockTransfer.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
      { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
      { model: Product, as:"product",attributes: ['id', 'name'] },
      { model: User, as:"user",attributes: ['id', 'fullName'] },
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

exports.getStockTransferById = catchAsync(async (req, res, next) => {
  const transfer = await StockTransfer.findByPk(req.params.transferId, {
    include: [
      { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
      { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
      { model: Product, as:"product",attributes: ['id', 'name'] },
      { model: User, as:"user", attributes: ['id', 'fullName'] },
    ],
  });

  if (!transfer) return next(new AppError('Stock transfer not found', 404));

  res.status(200).json({ status: 1, data: transfer });
});

exports.updateStockTransfer = catchAsync(async (req, res, next) => {
  const { quantity, note } = req.body;
  const transferId = req.params.transferId;

  const transfer = await StockTransfer.findByPk(transferId);
  if (!transfer) return next(new AppError('Stock transfer not found', 404));

  if (quantity !== undefined && quantity <= 0) {
    return next(new AppError('Quantity must be positive', 400));
  }

  const transaction = await sequelize.transaction();
  try {
    // Adjust stock only if quantity is changing
    if (quantity !== undefined && quantity !== transfer.quantity) {
      const diff = quantity - transfer.quantity; // positive => increase transfer, negative => decrease transfer

      // Check if source warehouse has enough stock for increase
      if (diff > 0) {
        const currentStock = await Stock.sum('quantity', {
          where: { businessId: transfer.businessId, warehouseId: transfer.fromWarehouseId, productId: transfer.productId },
        }) || 0;
        if (currentStock < diff) {
          await transaction.rollback();
          return next(new AppError('Insufficient stock in source warehouse for updated quantity', 400));
        }
      }

      // Revert previous transfer
      await adjustStock({
        businessId: transfer.businessId,
        warehouseId: transfer.fromWarehouseId,
        productId: transfer.productId,
        quantity: transfer.quantity,
        type: 'ADJUST',
        referenceId: transfer.id,
        note: 'Revert previous transfer OUT',
      }, transaction);

      await adjustStock({
        businessId: transfer.businessId,
        warehouseId: transfer.toWarehouseId,
        productId: transfer.productId,
        quantity: -transfer.quantity,
        type: 'ADJUST',
        referenceId: transfer.id,
        note: 'Revert previous transfer IN',
      }, transaction);

      // Apply new transfer
      await adjustStock({
        businessId: transfer.businessId,
        warehouseId: transfer.fromWarehouseId,
        productId: transfer.productId,
        quantity: -quantity,
        type: 'TRANSFER',
        referenceId: transfer.id,
        note: note || `Updated transfer OUT`,
      }, transaction);

      await adjustStock({
        businessId: transfer.businessId,
        warehouseId: transfer.toWarehouseId,
        productId: transfer.productId,
        quantity: quantity,
        type: 'TRANSFER',
        referenceId: transfer.id,
        note: note || `Updated transfer IN`,
      }, transaction);

      transfer.quantity = quantity;
    }

    if (note !== undefined) transfer.note = note;

    await transfer.save({ transaction });
    await transaction.commit();

    res.status(200).json({
      status: 1,
      message: 'Stock transfer updated successfully',
      data: transfer,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
});

exports.deleteStockTransfer = catchAsync(async (req, res, next) => {
  const transfer = await StockTransfer.findByPk(req.params.transferId);
  if (!transfer) return next(new AppError('Stock transfer not found', 404));

  const transaction = await sequelize.transaction();
  try {
    // Revert stock: IN to source
    await adjustStock({
      businessId: transfer.businessId,
      warehouseId: transfer.fromWarehouseId,
      productId: transfer.productId,
      quantity: transfer.quantity,
      type: 'ADJUST',
      referenceId: transfer.id,
      note: 'Revert transfer OUT',
    }, transaction);

    // Revert stock: OUT from destination
    await adjustStock({
      businessId: transfer.businessId,
      warehouseId: transfer.toWarehouseId,
      productId: transfer.productId,
      quantity: -transfer.quantity,
      type: 'ADJUST',
      referenceId: transfer.id,
      note: 'Revert transfer IN',
    }, transaction);

    await transfer.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({
      status: 1,
      message: 'Stock transfer deleted and reverted successfully',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
});