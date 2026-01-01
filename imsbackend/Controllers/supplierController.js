const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const Supplier  = db.Supplier;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/formatDate")

const {createMulterMiddleware,processUploadFilesToSave} = require('../utils/fileController');

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

// // Middleware for handling single file upload
// exports.uploadUserFile = userFileUpload.single('file');

exports.createSupplier= catchAsync(async (req, res, next) => {
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

console.log("Supplier model:", Supplier=== undefined ? "Not loaded" : "Loaded");
console.log("Testing table access...");
  
const existingSupplier = await Supplier.findOne({ where: { phone } });
if (existingSupplier) {
  // if (req.files) deleteFile(req.files.path);
  return (next(new AppError("PhoneNumber already in use", 404)))
}

  const newSupplier = await Supplier.create({
    name,
    phone,
    address,
    // documents: documents || null,
  });
  
  // Return success response
  res.status(200).json({
    message: 'Supplier registered successfully.',
    data: newSupplier,
  });

});

exports.getAllSuppliers= catchAsync(async (req, res, next) => {
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

  const {rows:suppliers}= await Supplier.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  console.log("Fetched customers:", suppliers);
  if (suppliers.length === 0) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'No suppliers found',
    suppliers: [],
  });
    // return next(new AppError("No customers found", 404));
  }

  const formattedSuppliers = suppliers.map(s => ({
    ...s.toJSON(),
    formattedCreatedAt: s.createdAt ? formatDate(s.createdAt) : null,
    formattedUpdatedAt: s.updatedAt ? formatDate(s.updatedAt) : null,
  }));

  res.status(200).json({
    status: 1,
    length: formattedSuppliers.length,
    message: 'suppliers fetched successfully',
    suppliers: formattedSuppliers,
  });
});

exports.getSupplier = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  const supplierId = parseInt(req.params.supplierId, 10); 
  console.log("Fetching customer with ID:", supplierId);
  const supplier = await Supplier.findByPk(supplierId);
  console.log("Fetched supplier:", supplier);

 if (!supplier) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'No supplier found',
    supplier: [],
  });
    // return next(new AppError("No customers found", 404));
  }

  const formattedCreatedAt = supplier.createdAt ? formatDate(supplier.createdAt) : null;
  const formattedUpdatedAt = supplier.updatedAt ? formatDate(supplier.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `supplier fetched successfully!`,
    supplier: {
      ...supplier.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateSupplier = catchAsync(async (req, res, next) => {
  const supplierId = parseInt(req.params.supplierId, 10); 
  const existingSupplier = await Supplier.findByPk(supplierId);
  if (!existingSupplier) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'Supplier not found',
  });
    //    return next(new AppError("Supplier not found", 404));
  }

  const orgiginalSupplierData = JSON.parse(JSON.stringify(existingSupplier));

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
  await existingSupplier.update(updateData);

  // Fetch latest version
  const updatedSupplier = await Supplier.findByPk(supplierId);

  // Format timestamps
  const formattedCreatedAt = updatedSupplier.createdAt ? formatDate(updatedSupplier.createdAt) : null;
  const formattedUpdatedAt = updatedSupplier.updatedAt ? formatDate(updatedSupplier.updatedAt) : null;

  // // Log update
  // await logAction({
  //   model: 'users',
  //   action: 'Update',
  //   actor: req.user?.id || 'system',
  //   description: 'User profile updated',
  //   data: {
  //     userId: updatedSupplier.id,
  //     beforeUpdate: originalUserData,
  //     updatedData: updateData,
  //   },
  //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
  //   severity: 'info',
  //   sessionId: req.session?.id || 'generated-session-id',
  // });

  res.status(200).json({
    status: 1,
    message: `${updatedSupplier.name} updated successfully`,
    updatedSupplier: {
      ...updatedSupplier.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.deleteSupplier = catchAsync(async (req, res, next) => {
  const supplierId = parseInt(req.params.supplierId, 10);

  const deletedCount = await Supplier.destroy({ where: { id: supplierId } });

  if (deletedCount === 0) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'Supplier entry not found',
  });
    //return next(new AppError("Supplier entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: 'Supplier deleted successfully',
  });
});

exports.deleteAllSuppliers= catchAsync(async (req, res, next) => {
  const deletedCount = await Supplier.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    res.status(200).json({
    status: 1,
    length:0,
    message: 'No Supplier entries found to delete',
  });
    //    return next(new AppError("No Customer entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: `${deletedCount} customers deleted`,
  });
});




