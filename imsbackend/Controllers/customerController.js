const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const Customer  = db.Customer;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

const {createMulterMiddleware,processUploadFilesToSave} = require('../utils/fileUtils');

// // Configure multer for user file uploads
// const userFileUpload = createMulterMiddleware(
//   'uploads/importedUsers/', // Destination folder
//   'User', // Prefix for filenames
//   ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] // Allowed file types
// );

// const filterObj = (obj, ...allowedFields) => {
//   const newObj = {};
//   Object.keys(obj).forEach(el => {
//     if (allowedFields.includes(el)) newObj[el] = obj[el];
//   });
//   return newObj;
// };

// Middleware for handling single file upload
// exports.uploadUserFile = userFileUpload.single('file');

exports.createCustomer = catchAsync(async (req, res, next) => {
  console.log("customer creation request", req.body)
  console.log("profileImages", req.files)
  const { name, phone,address} = req.body;
  if (!name || !phone || !address) {
    return next(new AppError("required Fields->name,phone or address)", 404))
  }
  
  // let { profileImage, documents } = await processUploadFilesToSave(req, req.files, req.body)
  // if(!profileImage){
  // profileImage=`${req.protocol}://${req.get('host')}/uploads/default.png`;// full URL to default image
  // }

console.log("Customer model:", Customer=== undefined ? "Not loaded" : "Loaded");
console.log("Testing table access...");
  
const existingCustomer = await Customer.findOne({ where: { phone } });
if (existingCustomer) {
  // if (req.files) deleteFile(req.files.path);
  return (next(new AppError("PhoneNumber already in use", 404)))
}

  const newCustomer = await Customer.create({
    name,
    phone,
    address,
    // documents: documents || null,
  });
  
  // Return success response
  res.status(200).json({
    message: 'Customer registered successfully.',
    data: newCustomer,
  });

});

exports.getAllCustomers = catchAsync(async (req, res, next) => {
  const {search, sortBy, sortOrder, page = 1, limit = 20 } = req.query;
  let whereQuery = {};

  // Search Filter (name, email, phone)
  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  const skip = (page - 1) * limit;

  const {rows:customers}= await Customer.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  console.log("Fetched customers:", customers);
  if (customers.length === 0) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'No customers found',
    customers: [],
  });
    // return next(new AppError("No customers found", 404));
  }

  const formattedCustomers = customers.map(c => ({
    ...c.toJSON(),
    formattedCreatedAt: c.createdAt ? formatDate(c.createdAt) : null,
    formattedUpdatedAt: c.updatedAt ? formatDate(c.updatedAt) : null,
  }));

  res.status(200).json({
    status: 1,
    length: formattedCustomers.length,
    message: 'customers fetched successfully',
    customers: formattedCustomers,
  });
});

exports.getCustomer = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  const customerId = parseInt(req.params.customerId, 10); 
  console.log("Fetching customer with ID:", customerId);
  const customer = await Customer.findByPk(customerId);
  console.log("Fetched customer:", customer);

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  const formattedCreatedAt = customer.createdAt ? formatDate(customer.createdAt) : null;
  const formattedUpdatedAt = customer.updatedAt ? formatDate(customer.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `customer fetched successfully!`,
    customer: {
      ...customer.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateCustomer = catchAsync(async (req, res, next) => {
  const customerId = parseInt(req.params.customerId, 10); 
  const existingCustomer = await Customer.findByPk(customerId);
  if (!existingCustomer) {
    return next(new AppError("Customer not found", 404));
  }

  const orgiginalCustomerData = JSON.parse(JSON.stringify(existingCustomer));

  // let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, existingUser)
  // if(!profileImage){
  //   profileImage=existingUser.profileImage
  // }
  // Process uploads
  
  // Merge update fields
  const updateData = {
    ...req.body,
    //profileImage
  };

  // Update user
  await existingCustomer.update(updateData);

  // Fetch latest version
  const updatedCustomer = await Customer.findByPk(customerId);

  // Format timestamps
  const formattedCreatedAt = updatedCustomer.createdAt ? formatDate(updatedCustomer.createdAt) : null;
  const formattedUpdatedAt = updatedCustomer.updatedAt ? formatDate(updatedCustomer.updatedAt) : null;

  // // Log update
  // await logAction({
  //   model: 'users',
  //   action: 'Update',
  //   actor: req.user?.id || 'system',
  //   description: 'User profile updated',
  //   data: {
  //     userId: updatedCustomer.id,
  //     beforeUpdate: originalUserData,
  //     updatedData: updateData,
  //   },
  //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
  //   severity: 'info',
  //   sessionId: req.session?.id || 'generated-session-id',
  // });

  res.status(200).json({
    status: 1,
    message: `${updatedCustomer.name} updated successfully`,
    updatedCustomer: {
      ...updatedCustomer.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const customerid = parseInt(req.params.customerId, 10);

  const deletedCount = await Customer.destroy({ where: { id: customerid } });

  if (deletedCount === 0) {
    return next(new AppError("Customer entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: 'Customer deleted successfully',
  });
});

exports.deleteAllCustomers= catchAsync(async (req, res, next) => {
  const deletedCount = await Customer.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    return next(new AppError("No Customer entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: `${deletedCount} customers deleted`,
  });
});




