const { Supplier } = require('../models');
const { Op } = require('sequelize');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

function parseAdditionalInfoMeta(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return { note: value };
    }
  }
  return {};
}

function buildAdditionalInfo({ rawAdditionalInfo, status, profileImage }) {
  const existingMeta = parseAdditionalInfoMeta(rawAdditionalInfo);
  const nextMeta = {
    ...existingMeta,
    status: status || existingMeta.status || 'active',
    profileImage: profileImage || existingMeta.profileImage || ''
  };
  return JSON.stringify(nextMeta);
}

function mapSupplierResponse(supplier) {
  const plain = supplier.toJSON ? supplier.toJSON() : supplier;
  const meta = parseAdditionalInfoMeta(plain.additionalInfo);
  return {
    ...plain,
    status: meta.status || plain.status || 'active',
    profileImage: meta.profileImage || plain.profileImage || ''
  };
}

exports.createSupplier = catchAsync(async (req, res, next) => {
  const {code,name,phone,email,country,city,address,taxNumber,additionalInfo,status} = req.body;
  const profileImage = req.files?.profileImage?.[0]
    ? `${req.protocol}://${req.get('host')}/uploads/supplierProfiles/${req.files.profileImage[0].filename}`
    : '';

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
    additionalInfo: buildAdditionalInfo({ rawAdditionalInfo: additionalInfo, status, profileImage })
  });

  res.status(201).json({
    status: 1,
    message: 'Supplier created successfully',
    data: mapSupplierResponse(supplier)
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
    suppliers: rows.map(mapSupplierResponse)
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
    data: mapSupplierResponse(supplier)
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

  const updateData = { ...req.body };
  const incomingStatus = req.body?.status;
  const uploadedProfileImage = req.files?.profileImage?.[0]
    ? `${req.protocol}://${req.get('host')}/uploads/supplierProfiles/${req.files.profileImage[0].filename}`
    : '';

  if (incomingStatus !== undefined || uploadedProfileImage) {
    updateData.additionalInfo = buildAdditionalInfo({
      rawAdditionalInfo: supplier.additionalInfo,
      status: incomingStatus,
      profileImage: uploadedProfileImage
    });
  }

  delete updateData.businessId;
  delete updateData.status;
  delete updateData.profileImage;

  await supplier.update(updateData);

  res.status(200).json({
    status: 1,
    message: 'Supplier updated successfully',
    data: mapSupplierResponse(supplier)
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
