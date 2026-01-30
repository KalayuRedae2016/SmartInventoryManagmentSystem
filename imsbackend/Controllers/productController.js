
const db = require('../models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const {Product,User,Category,Brand,Unit} = db;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const { formatDate } = require("../utils/dateUtils")
const {extractFiles} = require('../utils/fileUtils');

require('dotenv').config();

exports.createProduct = catchAsync(async (req, res, next) => {
  console.log("incoming product body:", req.body)
  console.log("uploading files:", req.files)
  const {businessId,name,sku,partNumber,serialTracking,categoryId,brandId,unitId,
    defaultCostPrice,defaultSellingPrice,lastPurchaseCost,minimumStock,
    preferredCostMethod,barcode,isActive}=req.body;
 if(!businessId||!name||!categoryId||!brandId||!unitId){
    return next(new AppError("missing required Fields for product creaton", 404))
  }
 
  // CHECK IF PRODUCT NAME ALREADY EXISTS
  const existingProduct = await Product.findOne({ where: { name } });
  if (existingProduct) {
    return next(new AppError("Product already exists", 400));
  }
const files=extractFiles(req, 'products');
const extractedImages =files.multiple('images');
console.log("extracted images",extractedImages)
   
const newProduct = await Product.create({
  businessId,
  name,
  sku,
  partNumber,
  serialTracking,
  categoryId,
  brandId,
  unitId,
  defaultCostPrice,
  defaultSellingPrice,
  lastPurchaseCost,
  minimumStock,
  preferredCostMethod,
  barcode,
  images:extractedImages,
  isActive: isActive ?? true
  
});

  // Return success response
  res.status(200).json({
    status: 1,
    message: 'Product Created successfully.',
    product: newProduct,
  });

});

// exports.getAllProducts = catchAsync(async (req, res, next) => {
//   const { isActive, search, sortBy, sortOrder, page = 1, limit = 20 } = req.query;
//   let whereQuery = {};
//   if (!req.user.role==="admin") {
//     whereQuery = { role: req.user.role };
//   } 

//   // isActive Filter
//   if (isActive !== undefined) {
//     whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
//   }

//   // Search Filter (name, email, phone)
//   if (search) {
//     whereQuery[Op.or] = [
//       { fullName: { [Op.like]: `%${search}%` } },
//       { email: { [Op.like]: `%${search}%` } },
//       { phoneNumber: { [Op.like]: `%${search}%` } },
//       { address: { [Op.like]: `%${search}%` } },
//       { role: { [Op.like]: `%${search}%` } },
//     ];
//   }

//   const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
//   const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
//   const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

//   // Pagination
//   const skip = (page - 1) * limit;

//   // 4️FETCH USERS (PAGINATED + FILTERED)
//   const { rows: users, count: totalFiltered } = await User.findAndCountAll({
//     where: whereQuery,
//     offset: skip,
//     limit: Number(limit),
//     order: [[sortColumn, orderDirection]],
//   });

//   if (users.length === 0) {
//     return next(new AppError("No users found", 404));
//   }


//   const formattedUsers = users.map(u => ({
//     ...u.toJSON(),
//     formattedCreatedAt: u.createdAt ? formatDate(u.createdAt) : null,
//     formattedUpdatedAt: u.updatedAt ? formatDate(u.updatedAt) : null,
//   }));

//   // // 6️ FAST SQL COUNTERS FOR DASHBOARD
//   // const [
//   //   activeUsers,
//   //   deactiveUsers,
//   //   activeStaffs,
//   //   deactiveStaffs,
//   //   adminUsers,
//   // ] = await Promise.all([
//   //   User.count({ where: { role: "user", isActive: true } }),
//   //   User.count({ where: { role: "user", isActive: false } }),
//   //   User.count({ where: { role: "staff", isActive: true } }),
//   //   User.count({ where: { role: "staff", isActive: false } }),
//   //   User.count({ where: { role: "admin" } }),
//   // ]);

//   // 7️⃣ SEND RESPONSE
//   res.status(200).json({
//     status: 1,
//     length: formattedUsers.length,
//     message: 'Users fetched successfully',
//     // pagination: {
//     //   totalFiltered,
//     //   currentPage: Number(page),
//     //   limit: Number(limit),
//     //   totalPages: Math.ceil(totalFiltered / limit),
//     // },
//     // counts: {
//     //   activeUsers,
//     //   deactiveUsers,
//     //   activeStaffs,
//     //   deactiveStaffs,
//     //   adminUsers,
//     // },
//     users: formattedUsers,
//   });
// });

// exports.getUser = catchAsync(async (req, res, next) => {
//   console.log("Requested User Role:", req.user.role,req.params);
//   let userId = req.params.userId; // default: self-access

//   // Admins can access any user
//   if (req.user.role === "admin") {
//     userId = req.params.userId;
//   }

//   // Doctors can access- their own data, users' (patients') data,not other doctors/admins
//   if (req.user.role === "staff") {
//     const targetUserId = req.params.userId;
//     if (targetUserId && targetUserId !== req.user.id) {
//       const targetUser = await User.findByPk(targetUserId);
//       if (!targetUser) {
//         return next(new AppError('User not found', 404));
//       }

//       // Doctors can only view users (patients), not other doctors or admins
//       if (targetUser.role !== "user") {
//         return next(new AppError("Access denied: You can only view profiles.", 403));
//       }

//       userId = targetUserId;
//     }
//   }

//   // Normal users can only view their own data (already set above)
//   const user = await User.findByPk(userId);

//   if (!user) {
//     return next(new AppError('User not found', 404));
//   }

//   const formattedCreatedAt = user.createdAt ? formatDate(user.createdAt) : null;
//   const formattedUpdatedAt = user.updatedAt ? formatDate(user.updatedAt) : null;
  
//   res.status(200).json({
//     status: 1,
//     message: `Profile fetched successfully!`,
//     data: {
//       ...user.toJSON(),
//       formattedCreatedAt,
//       formattedUpdatedAt
//     },
//   });
// });

// exports.updateUserProfile = catchAsync(async (req, res, next) => {
//   const targetUserId = req.params.userId;

//   // Role-based access control
//   if (req.user.role === 'user' && req.user.id !== targetUserId) {
//     return next(new AppError("Access denied: You can only update your own profile", 403));
//   }

//   if (req.user.role === 'doctor') {
//     if (req.user.id !== targetUserId) {
//       const targetUser = await User.findByPk(targetUserId);
//       if (!targetUser || targetUser.role !== 'user') {
//         return next(new AppError("Access denied: Doctors can only update their own or user (patient) profiles", 403));
//       }
//     }
//   }

//   const existingProduct = await User.findByPk(targetUserId);
//   if (!existingProduct) {
//     return next(new AppError("User not found", 404));
//   }

//   const originalUserData = JSON.parse(JSON.stringify(existingProduct));
  
//   let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, existingUser)
//   if(!profileImage){
//     profileImage=existingUser.profileImage
//   }
//   // Process uploads
  
//   // Merge update fields
//   const updateData = {
//     ...req.body,
//     profileImage
//   };

//   // Update user
//   await existingUser.update(updateData);

//   // Fetch latest version
//   const updatedUser = await User.findByPk(targetUserId);

//   // Format timestamps
//   const formattedCreatedAt = updatedUser.createdAt ? formatDate(updatedUser.createdAt) : null;
//   const formattedUpdatedAt = updatedUser.updatedAt ? formatDate(updatedUser.updatedAt) : null;

//   // // Log update
//   // await logAction({
//   //   model: 'users',
//   //   action: 'Update',
//   //   actor: req.user?.id || 'system',
//   //   description: 'User profile updated',
//   //   data: {
//   //     userId: updatedUser.id,
//   //     beforeUpdate: originalUserData,
//   //     updatedData: updateData,
//   //   },
//   //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
//   //   severity: 'info',
//   //   sessionId: req.session?.id || 'generated-session-id',
//   // });

//   res.status(200).json({
//     status: 1,
//     message: `${updatedUser.fullName} updated successfully`,
//     updatedUser: {
//       ...updatedUser.toJSON(),
//       formattedCreatedAt,
//       formattedUpdatedAt,
//     },
   
//   });
// });

// exports.deleteUser = catchAsync(async (req, res, next) => {
//   const userId = parseInt(req.params.userId, 10); // ensure it's an integer

//   const deletedCount = await User.destroy({ where: { id: userId } });

//   if (deletedCount === 0) {
//     return next(new AppError("User entry not found", 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     message: 'User deleted successfully',
//   });
// });

// exports.deleteUsers = catchAsync(async (req, res, next) => {
//   const deletedCount = await User.destroy({
//     where: {}, // No condition = delete all rows
//   });

//   if (deletedCount === 0) {
//     return next(new AppError("No user entries found to delete", 404));
//   }

//   //🧹 Delete profile image from disk
//   //🧹 log action
//   res.status(200).json({
//     status: 'success',
//     message: `${deletedCount} users deleted`,
//   });
// });



