'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const {Business,Warehouse,User,sequelize} = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { emailBusinessDetail } = require('../utils/emailUtils');
const {extractFiles}=require("../utils/fileUtils")

exports.createBusiness = catchAsync(async (req, res, next) => {
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

    await emailBusinessDetail(user,"business_owner",phone);

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

exports.getAllBusiness = catchAsync(async (req, res) => {
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

  const { rows, count } = await Business.findAndCountAll({
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

exports.getBusinessById = catchAsync(async (req, res, next) => {
  const business = await Business.findByPk(req.params.businessId);
  console.log("requred businessID",req.params.businessId)

  if (!business) {
    return next(new AppError('Business not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: business
  });
});

exports.updateBusinessById = catchAsync(async (req, res, next) => {
  const business = await Business.findByPk(req.params.businessId);
  console.log("updating business id",req.params.businessId)

  if (!business) {
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
if(Object.keys(updates).length > 0)
  await Business.update(updates, { where: { id: req.params.businessId } });

const updatdBusiness = await Business.findByPk(req.params.businessId);

  res.status(200).json({
    status: 1,
    message: 'Business updated successfully',
    data: updatdBusiness
  });
});

exports.updateBusinessStatus = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  console.log("action to be performed",action)
  const business = await Business.findByPk(req.params.businessId);

  if (!business) {
    return next(new AppError('Business not found', 404));
  }

  if (!['activate', 'expire', 'disable'].includes(action)) {
    return next(new AppError('Invalid action', 400));
  }

  switch (action) {
    case 'activate':
      business.subscriptionStatus = 'active';
      business.isActive = true;
      business.trialEnd = null;
      break;

    case 'expire':
      business.subscriptionStatus = 'expired';
      business.isActive = false;
      break;

    case 'disable':
      business.isActive = false;
      break;
  }

  await business.save();

  res.status(200).json({
    status: 'success',
    message: `Business ${action}d successfully`,
    data: business
  });
});

exports.deleteBusinessById = catchAsync(async (req, res, next) => {
  const business = await Business.findByPk(req.params.businessId);

  if (!business) return next(new AppError('Business not found', 404));

  await business.update({ isActive: false });

  res.status(200).json({
    status: 1,
    message: 'Business deactivated successfully'
  });
});
