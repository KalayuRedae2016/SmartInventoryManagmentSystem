const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {Bussiness, Customer} = require('../models');
const { Op, where } = require('sequelize');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

exports.createCustomer = catchAsync(async (req, res, next) => {
  const {code,name,phone,email,country,city,address,taxNumber,additionalInfo} = req.body;
  console.log("Request Body:", req.body);
  // const businessId = req.user.businessId||1;
  const businessId = 1;

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
    additionalInfo
  });

  res.status(201).json({
    status: 1,
    message: 'Customer created successfully',
    customer
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
    customers: rows
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
    data: customer
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

  await customer.update(req.body);

  res.status(200).json({
    status: 1,
    message: 'Customer updated successfully',
    data: customer
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