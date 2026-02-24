const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {Bussiness, Customer} = require('../models');
const { Op, where } = require('sequelize');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

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

function mapCustomerResponse(customer) {
  const plain = customer.toJSON ? customer.toJSON() : customer;
  const meta = parseAdditionalInfoMeta(plain.additionalInfo);
  return {
    ...plain,
    status: meta.status || plain.status || 'active',
    profileImage: meta.profileImage || plain.profileImage || ''
  };
}

exports.createCustomer = catchAsync(async (req, res, next) => {
  const {code,name,phone,email,country,city,address,taxNumber,additionalInfo,status} = req.body;
  console.log("Request Body:", req.body);
  // const businessId = req.user.businessId||1;
  const businessId = 1;
  const profileImage = req.files?.profileImage?.[0]
    ? `${req.protocol}://${req.get('host')}/uploads/customerProfiles/${req.files.profileImage[0].filename}`
    : '';

  if (!code || !name) {
    return next(new AppError('Missing required fields', 400));
  }

  const existingCustomer = await Customer.findOne({
    where: {businessId,[Op.or]: [{ code }, { name }]}
  });

  if (existingCustomer) return next(new AppError('Customer already exists', 409));

  const customer = await Customer.create({
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
    message: 'Customer created successfully',
    customer: mapCustomerResponse(customer)
  });
});

exports.getAllCustomers = catchAsync(async (req, res, next) => {
  const {
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = req.query;

  // const where = { businessId: req.user.businessId };
  const where = { businessId: 1 };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Customer.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']]
  });

  if (!rows.length) {
    return next(new AppError('No customers found', 404));
  }

  res.status(200).json({
    status: 1,
    total: count,
    length: rows.length,
    customers: rows.map(mapCustomerResponse)
  });
});
exports.getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    where: {
      id: req.params.customerId,
      businessId: 1 //req.user.businessId
    }
  });

  if (!customer) return next(new AppError('Customer not found', 404));
  
  res.status(200).json({
    status: 1,
    message: 'Customer retrieved successfully',
    data: mapCustomerResponse(customer)
  });
});

exports.updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    where: {
      id: req.params.customerId,
      businessId: 1 //req.user.businessId
    }
  });

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  const updateData = { ...req.body };
  const incomingStatus = req.body?.status;
  const uploadedProfileImage = req.files?.profileImage?.[0]
    ? `${req.protocol}://${req.get('host')}/uploads/customerProfiles/${req.files.profileImage[0].filename}`
    : '';
  if (incomingStatus !== undefined || uploadedProfileImage) {
    updateData.additionalInfo = buildAdditionalInfo({
      rawAdditionalInfo: customer.additionalInfo,
      status: incomingStatus,
      profileImage: uploadedProfileImage
    });
  }

  delete updateData.status;
  delete updateData.profileImage;

  await customer.update(updateData);

  res.status(200).json({
    status: 1,
    message: 'Customer updated successfully',
    data: mapCustomerResponse(customer)
  });
});
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const deleted = await Customer.destroy({
    where: {
      id: req.params.customerId,
      businessId: 1 //req.user.businessId
    }
  });

  if (!deleted) {
    return next(new AppError('Customer not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Customer deleted successfully'
  });
});
exports.deleteAllCustomers = catchAsync(async (req, res, next) => {
  const deleted = await Customer.destroy({
    where: {
      businessId: 1 //req.user.businessId
    }
  }); 
  res.status(200).json({
    status: 1,
    message: `${deleted} customers deleted successfully`
  });
});
