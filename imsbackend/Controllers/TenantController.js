'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const {Business,Warehouse,User,sequelize} = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { emailBusinessDetail } = require('../utils/emailUtils');
const {extractFiles}=require("../utils/fileUtils")


exports.createTenant = catchAsync(async (req, res, next) => {
  console.log("requested data",req.body)
  console.log("requsted files",req.files)
  const { name,ownerName,phone,email,address,logo } = req.body;

  if (!name || !ownerName || !phone || !email || !address) {
    return next(new AppError('Fill all required business fields', 400));
  }

  const existTenant = await Business.findOne({
    where: {[Op.or]: [{ name }, { email },{ phone}]}
  });

  if (existTenant)     return next(new AppError('Business with same name or email already exists', 409));
  
  const files=extractFiles(req, 'tenants');
  const extractedlogo =files.single('logo');
  console.log("extracted logo",extractedlogo)
  
  const transaction = await sequelize.transaction();

  try {
    const business = await Business.create({
      name,
      ownerName,
      phone,
      email,
      address,
      logo:extractedlogo,
      subscriptionStatus: 'trial',
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    }, { transaction });

  
    const user = await User.create({
      businessId: business.id,
      fullName:ownerName,
      roleId: 1, // business_owner role
      phoneNumber: phone,
      email,
      address,
      password: await bcrypt.hash(phone, 12),
      profileImage: logo,
      businessId: business.id
    }, { transaction });

    const warehouse = await Warehouse.create({
      businessId: business.id,
      name: `${name} Main Warehouse`,
      code: 'WH-001',
      location: address,
      managerName: ownerName,
      phone,email,    
    }, { transaction });

    await transaction.commit();

    await emailBusinessDetail(user);

    res.status(201).json({
      status: 'success',
      message: 'Business created successfully',
      data: {
        business,
        owner: user,
        warehouse
      }
    });

  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
});

exports.getAllTenants = catchAsync(async (req, res) => {
  const {isActive,search,page = 1,limit = 20,sortBy = 'createdAt',sortOrder = 'DESC'} = req.query;

  const where = {};

  if (isActive !== undefined) {
    where.isActive = ['true', '1'].includes(isActive);
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { ownerName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await business.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]]
  });

  res.status(200).json({
    status: 'success',
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
    results: rows.length,
    data: rows
  });
});

exports.getTenantById = catchAsync(async (req, res, next) => {
  const tenant = await business.findByPk(req.params.businessId);

  if (!tenant) {
    return next(new AppError('Business not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: tenant
  });
});


exports.updateTenant = catchAsync(async (req, res, next) => {
  const tenant = await business.findByPk(req.params.businessId);

  if (!tenant) {
    return next(new AppError('Business not found', 404));
  }

  const allowedFields = [
    'name',
    'ownerName',
    'phone',
    'email',
    'address',
    'logo'
  ];

  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  await tenant.update(updates);

  res.status(200).json({
    status: 'success',
    data: tenant
  });
});


exports.updateBusinessStatus = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  const tenant = await business.findByPk(req.params.businessId);

  if (!tenant) {
    return next(new AppError('Business not found', 404));
  }

  if (!['activate', 'expire', 'disable'].includes(action)) {
    return next(new AppError('Invalid action', 400));
  }

  switch (action) {
    case 'activate':
      tenant.subscriptionStatus = 'active';
      tenant.isActive = true;
      tenant.trialEnd = null;
      break;

    case 'expire':
      tenant.subscriptionStatus = 'expired';
      tenant.isActive = false;
      break;

    case 'disable':
      tenant.isActive = false;
      break;
  }

  await tenant.save();

  res.status(200).json({
    status: 'success',
    message: `Business ${action}d successfully`,
    data: tenant
  });
});


exports.deleteTenant = catchAsync(async (req, res, next) => {
  const tenant = await business.findByPk(req.params.businessId);

  if (!tenant) {
    return next(new AppError('Business not found', 404));
  }

  await tenant.destroy();

  res.status(204).json({
    status: 'success'
  });
});
