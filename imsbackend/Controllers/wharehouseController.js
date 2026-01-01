const { Warehouse, Stock } = require('../Models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createWarehouse = catchAsync(async (req, res, next) => {
  const { name, code, location, phone, managerName } = req.body;

  if (!name || !code) {
    return next(new AppError('Warehouse name and code are required', 400));
  }

  const exists = await Warehouse.findOne({ where: { code } });
  if (exists) {
    return next(new AppError('Warehouse code already exists', 409));
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    location,
    phone,
    managerName,
  });

  res.status(201).json({
    status: 'success',
    data: warehouse,
  });
});

exports.getAllWarehouses = catchAsync(async (req, res) => {
  const {
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    page = 1,
    limit = 20,
  } = req.query;

  const whereQuery = {};

  if (isActive !== undefined) {
    whereQuery.isActive = ['true', '1'].includes(isActive);
  }

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { location: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { managerName: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ['createdAt', 'updatedAt', 'name', 'code'];
  const orderColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : 'createdAt';

  const offset = (page - 1) * limit;

  const { rows, count } = await Warehouse.findAndCountAll({
    where: whereQuery,
    limit: Number(limit),
    offset,
    order: [[orderColumn, sortOrder === 'asc' ? 'ASC' : 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
    results: rows.length,
    data: rows,
  });
});

exports.getWarehouseById = catchAsync(async (req, res, next) => {
  const warehouse = await Warehouse.findByPk(req.params.id);

  if (!warehouse) {
    return next(new AppError('Warehouse not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: warehouse,
  });
});

exports.updateWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await Warehouse.findByPk(req.params.id);
  if (!warehouse) {
    return next(new AppError('Warehouse not found', 404));
  }

  const allowedFields = ['name', 'location', 'phone', 'managerName', 'isActive'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  await warehouse.update(updates);

  res.status(200).json({
    status: 'success',
    data: warehouse,
  });
});

exports.toggleWarehouseStatus = catchAsync(async (req, res, next) => {
  const warehouse = await Warehouse.findByPk(req.params.id);
  if (!warehouse) {
    return next(new AppError('Warehouse not found', 404));
  }

  warehouse.isActive = !warehouse.isActive;
  await warehouse.save();

  res.status(200).json({
    status: 'success',
    isActive: warehouse.isActive,
  });
});

exports.deleteWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await Warehouse.findByPk(req.params.id);
  if (!warehouse) {
    return next(new AppError('Warehouse not found', 404));
  }

  const stockCount = await Stock.count({
    where: { warehouseId: warehouse.id },
  });

  if (stockCount > 0) {
    return next(
      new AppError('Cannot delete warehouse with existing stock', 400)
    );
  }

  await warehouse.destroy();

  res.status(204).json({ status: 'success' });
});
