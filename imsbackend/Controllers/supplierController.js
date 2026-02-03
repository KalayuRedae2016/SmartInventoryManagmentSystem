const { Supplier } = require('../models');
const { Op } = require('sequelize');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

exports.createSupplier = catchAsync(async (req, res, next) => {
  const {code,name,phone,email,country,city,address,taxNumber,additionalInfo} = req.body;

  if (!code || !name) {
    return next(new AppError('Code and name are required', 400));
  }

  const businessId = getBusinessId();

  const exists = await Supplier.findOne({
    where: {
      businessId,
      [Op.or]: [{ code }, { name }]
    }
  });

  if (exists) {
    return next(new AppError('Supplier already exists', 409));
  }

  const supplier = await Supplier.create({
    businessId,
    code,
    name,
    phone,
    email,
    country,
    city,
    address,
    taxNumber,
    additionalInfo
  });

  res.status(201).json({
    status: 1,
    message: 'Supplier created successfully',
    data: supplier
  });
});

exports.getAllSuppliers = catchAsync(async (req, res, next) => {
  const { search, page = 1, limit = 20 } = req.query;

  const where = { businessId: getBusinessId() };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Supplier.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 1,
    total: count,
    suppliers: rows
  });
});

exports.getSupplierById = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findOne({
    where: {
      id: req.params.supplierId,
      businessId: getBusinessId()
    }
  });

  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }

  res.status(200).json({
    status: 1,
    data: supplier
  });
});

exports.updateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findOne({
    where: {
      id: req.params.supplierId,
      businessId: getBusinessId()
    }
  });

  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }

  delete req.body.businessId;

  await supplier.update(req.body);

  res.status(200).json({
    status: 1,
    message: 'Supplier updated successfully',
    data: supplier
  });
});

exports.deleteSupplier = catchAsync(async (req, res, next) => {
  const deleted = await Supplier.destroy({
    where: {
      id: req.params.supplierId,
      businessId: getBusinessId()
    }
  });

  if (!deleted) {
    return next(new AppError('Supplier not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Supplier deleted successfully'
  });
});

exports.deleteAllSuppliers = catchAsync(async (req, res, next) => {
  await Supplier.destroy({
    where: {
      businessId: getBusinessId()
    }
  });  
    res.status(200).json({
    status: 1,
    message: 'All suppliers deleted successfully'
  });
});