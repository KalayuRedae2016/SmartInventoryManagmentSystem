const { StockAdjustment, Stock, Warehouse, Product, User,StockTransaction } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const sequelize = require('../models').sequelize;
const { Op } = require('sequelize');

const getBusinessId = () => 1;

const buildWhereClause = (user,query) => {
  const {warehouseId,productId,userId,minQuantity,maxQuantity,adjustmentType,search,isActive,startDate,endDate,} = query;

  let whereQuery = { businessId: user.businessId};

  if (isActive !== undefined) whereQuery.isActive = ["true", "1", true, 1].includes(isActive);

  if(warehouseId) whereQuery.warehouseId=categoryId
  if(productId) whereQuery.productId=productId
  if(userId) whereQuery.userId=userId

  if(minQuantity||maxQuantity){
    whereQuery.quantity={}
    if (minQuantity) whereQuery.paidAmount[Op.gte] = Number(minQuantity);
    if (maxQuantity) whereQuery.paidAmount[Op.lte] = Number(maxQuantity);
  }

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};
  
  if(adjustmentType) whereQuery.adjustmentType=adjustmentType

  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereQuery;
};

exports.createStockAdjustment = catchAsync(async (req, res, next) => {
  const { warehouseId, productId, quantity, adjustmentType, note } = req.body;
  const businessId = req.user.businessId;

  if (!warehouseId || !productId || !quantity || !adjustmentType) {
    return next(new AppError('warehouseId, productId, quantity, and adjustmentType are required', 400));
  }

  if (!['IN', 'OUT'].includes(adjustmentType)) {
    return next(new AppError('adjustmentType must be IN or OUT', 400));
  }

  const t = await sequelize.transaction();

  try {
    // 1️ Create StockAdjustment record
    const stockAdjustment = await StockAdjustment.create({
      businessId,
      warehouseId,
      productId,
      quantity,
      adjustmentType,
      note,
      userId: req.user.id,
    }, { transaction: t });

    // 2️ Update Stock table
    const [stock] = await Stock.findOrCreate({
      where: { businessId, warehouseId, productId },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (adjustmentType === 'IN') {
      stock.quantity += quantity;
    } else {
      stock.quantity -= quantity;
      if (stock.quantity < 0) stock.quantity = 0; // prevent negative stock
    }
    await stock.save({ transaction: t });

    // 3️ Record StockTransaction for history
    await StockTransaction.create({
      businessId,
      warehouseId,
      productId,
      quantity,
      type: adjustmentType,
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: stockAdjustment.id,
      performedBy: req.user.id,
      note: `Stock adjustment ${adjustmentType} (Adjustment ID: ${stockAdjustment.id})`,
      valueDate: new Date(),
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      status: 1,
      message: 'Stock adjustment created successfully',
      data: stockAdjustment,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.getStockAdjustments = catchAsync(async (req, res) => {
const { page = 1, limit = 10} = req.query;
 
const where = buildWhereClause(req.user,req.query)
const adjustments = await StockAdjustment.findAndCountAll({
    where: where,
    include: [
      { model: Product, as: 'product', attributes: ['id','name','sku'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id','name'] },
      { model: User, as: 'user', attributes: ['id','fullName'] }
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
  const adjustment = await StockAdjustment.findByPk(req.params.adjustmentId, {
    include: [
      { model: Product, as: 'product', attributes: ['id','name','sku'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id','name'] },
      { model: User, as: 'user', attributes: ['id','fullName'] }
    ],
    
  });
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  res.status(200).json({
    status: 1,
    data: adjustment,
  });
});

exports.updateStockAdjustment = catchAsync(async (req, res, next) => {
  const { quantity, adjustmentType, note, warehouseId, productId } = req.body;
  const adjustmentId = req.params.adjustmentId;
  const businessId = req.user.businessId;

  const adjustment = await StockAdjustment.findByPk(adjustmentId);
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  const t = await sequelize.transaction();

  try {
    // 1 Determine previous values
    const prevQuantity = adjustment.quantity;
    const prevType = adjustment.adjustmentType;
    const prevWarehouse = adjustment.warehouseId;
    const prevProduct = adjustment.productId;

    // 2 Calculate difference for stock update
    let stockChange = 0;

    // If type or quantity changed
    if (quantity !== undefined || adjustmentType !== undefined) {
      const newQuantity = quantity !== undefined ? quantity : prevQuantity;
      const newType = adjustmentType !== undefined ? adjustmentType : prevType;

      if (!['IN', 'OUT'].includes(newType)) {
        return next(new AppError('adjustmentType must be IN or OUT', 400));
      }

      // Compute stock difference
      stockChange = (newType === 'IN' ? 1 : -1) * newQuantity- (prevType === 'IN' ? 1 : -1) * prevQuantity;

      adjustment.quantity = newQuantity;
      adjustment.adjustmentType = newType;
    }

    if (note !== undefined) adjustment.note = note;
    if (warehouseId !== undefined) adjustment.warehouseId = warehouseId;
    if (productId !== undefined) adjustment.productId = productId;

    await adjustment.save({ transaction: t });

    // 3 Update stock if needed
    if (stockChange !== 0 || warehouseId || productId) {
      const stock = await Stock.findOrCreate({
        where: {
          businessId,
          warehouseId: adjustment.warehouseId,
          productId: adjustment.productId
        },
        defaults: { quantity: 0 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }).then(([s]) => s);

      stock.quantity += stockChange;
      if (stock.quantity < 0) stock.quantity = 0;
      await stock.save({ transaction: t });

      // 4️ Record StockTransaction for update
      await StockTransaction.create({
        businessId,
        warehouseId: adjustment.warehouseId,
        productId: adjustment.productId,
        quantity: stockChange,
        type: stockChange > 0 ? 'IN' : 'OUT',
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: adjustment.id,
        performedBy: req.user.id,
        note: `Stock adjustment updated (Adjustment ID: ${adjustment.id})`,
        valueDate: new Date(),
      }, { transaction: t });
    }

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Stock adjustment updated successfully',
      data: adjustment,
    });

  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.deleteStockAdjustment = catchAsync(async (req, res, next) => {
  const adjustmentId = req.params.adjustmentId;
  const businessId = req.user.businessId;

  const adjustment = await StockAdjustment.findByPk(adjustmentId);
  if (!adjustment) return next(new AppError('Stock adjustment not found', 404));

  const t = await sequelize.transaction();

  try {
    // 1 Determine stock impact
    const stockChange = adjustment.adjustmentType === 'IN'
      ? -adjustment.quantity
      : adjustment.quantity;

    // 2 Update stock
    const stock = await Stock.findOne({
      where: {
        businessId,
        warehouseId: adjustment.warehouseId,
        productId: adjustment.productId
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (stock) {
      stock.quantity += stockChange;
      if (stock.quantity < 0) stock.quantity = 0;
      await stock.save({ transaction: t });
    }

    // 3 Record StockTransaction
    await StockTransaction.create({
      businessId,
      warehouseId: adjustment.warehouseId,
      productId: adjustment.productId,
      quantity: stockChange,
      type: stockChange > 0 ? 'IN' : 'OUT',
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: adjustment.id,
      performedBy: req.user.id,
      note: `Stock adjustment deleted (Adjustment ID: ${adjustment.id})`,
      valueDate: new Date(),
    }, { transaction: t });

    // 4️ Delete the adjustment
    await adjustment.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Stock adjustment deleted successfully',
    });

  } catch (err) {
    await t.rollback();
    throw err;
  }
});