const { Op } = require('sequelize');
const { Stock, Product, Warehouse } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

function includeModels() {
  return [
    { model: Product, as: 'product' ,attributes:['id',"name"]},
    { model: Warehouse, as: 'warehouse',attributes:["id","name"] },
  ];
}

exports.createStock = catchAsync(async (req, res, next) => {
  const { businessId, warehouseId, productId, quantity, stockAlert, description } = req.body;
  const resolvedBusinessId = Number(businessId || getBusinessId());

  if (!warehouseId || !productId || quantity === undefined) {
    return next(new AppError('warehouseId, productId and quantity are required', 400));
  }

  const stock = await Stock.create({
    businessId: resolvedBusinessId,
    warehouseId: Number(warehouseId),
    productId: Number(productId),
    quantity: Number(quantity),
    stockAlert: Number(stockAlert || 0),
    description: description || null,
  });

  const created = await Stock.findByPk(stock.id, { include: includeModels() });

  res.status(201).json({
    status: 1,
    message: 'Stock created successfully',
    data: created,
  });
});

exports.getStocks = catchAsync(async (req, res) => {
  const {warehouseId,productId,search,sortBy = 'createdAt',sortOrder = 'DESC', page = 1,limit = 20 } = req.query;

  const businessId = req.user.businessId;
  const where = { businessId };

  if (warehouseId) where.warehouseId = Number(warehouseId);
  if (productId) where.productId = Number(productId);

  if (search) {
    where[Op.or] = [
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ['createdAt', 'updatedAt', 'quantity', 'warehouseId', 'productId'];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
  const safeLimit = Math.max(1, Number(limit) || 20);
  const safePage = Math.max(1, Number(page) || 1);

  const stocks = await Stock.findAndCountAll({
    where,
    include: includeModels(),
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    order: [[orderColumn, String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: stocks.count,
    page: safePage,
    pages: Math.ceil(stocks.count / safeLimit),
    results: stocks.rows.length,
    data: stocks.rows,
  });
});

exports.getStockById = catchAsync(async (req, res, next) => {
  const stock = await Stock.findByPk(req.params.stockId, { include: includeModels() });
  if (!stock) return next(new AppError('Stock not found', 404));

  res.status(200).json({
    status: 1,
    data: stock,
  });
});

exports.updateStock = catchAsync(async (req, res, next) => {
  const stock = await Stock.findByPk(req.params.stockId);
  if (!stock) return next(new AppError('Stock not found', 404));

  const { warehouseId, productId, quantity, stockAlert, description } = req.body;

  if (warehouseId !== undefined) stock.warehouseId = Number(warehouseId);
  if (productId !== undefined) stock.productId = Number(productId);
  if (quantity !== undefined) stock.quantity = Number(quantity);
  if (stockAlert !== undefined) stock.stockAlert = Number(stockAlert);
  if (description !== undefined) stock.description = description || null;

  await stock.save();

  const updated = await Stock.findByPk(stock.id, { include: includeModels() });

  res.status(200).json({
    status: 1,
    message: 'Stock updated successfully',
    data: updated,
  });
});

exports.deleteStock = catchAsync(async (req, res, next) => {
  const stock = await Stock.findByPk(req.params.stockId);
  if (!stock) return next(new AppError('Stock not found', 404));

  await stock.destroy();

  res.status(200).json({
    status: 1,
    message: 'Stock deleted successfully',
  });
});

exports.importStocks = catchAsync(async (req, res, next) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  const businessId = Number(req.body?.businessId || getBusinessId());

  if (!items || !items.length) {
    return next(new AppError('items array is required for import', 400));
  }

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const warehouseId = Number(item.warehouseId);
    const productId = Number(item.productId);

    if (!warehouseId || !productId) continue;

    const existing = await Stock.findOne({
      where: { businessId, warehouseId, productId },
    });

    if (existing) {
      existing.quantity = Number(item.quantity ?? existing.quantity ?? 0);
      if (item.stockAlert !== undefined) existing.stockAlert = Number(item.stockAlert || 0);
      if (item.description !== undefined) existing.description = item.description || null;
      await existing.save();
      updated += 1;
      continue;
    }

    await Stock.create({
      businessId,
      warehouseId,
      productId,
      quantity: Number(item.quantity || 0),
      stockAlert: Number(item.stockAlert || 0),
      description: item.description || null,
    });
    created += 1;
  }

  res.status(200).json({
    status: 1,
    message: 'Stock import processed successfully',
    data: { created, updated, total: items.length },
  });
});

exports.exportStocks = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 1,
    message: 'Stock export generated successfully',
  });
});
