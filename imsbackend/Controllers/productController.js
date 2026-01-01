
const db = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Product = db.Product;
const User = db.User;
const Category = db.Category;
const Brand = db.brand;
const Unit= db.Unit;

const catchAsync = require("../Utils/catchAsync")
const AppError = require("../Utils/appError")
const { formatDate } = require("../utils/formatDate")
const {processUploadFilesToSave,deleteFile} = require('../Utils/fileController');

require('dotenv').config();

exports.createProduct = catchAsync(async (req, res, next) => {
  console.log("incoming product body:", req.body)
  console.log("uploading files:", req.files)
  const {name,sku,partNumber,serialTracking,categoryId,brandId,unitId,
    defaultCostPrice,defaultSellingPrice,lastPurchaseCost,minimumStock,
    preferredCostMethod,barcode,isActive}=req.body;

 if(!name||!categoryId||!brandId||!unitId){
    return next(new AppError("missing required Fields for product creaton", 404))
  }
 
  // CHECK IF PRODUCT NAME ALREADY EXISTS
  const existingProduct = await Product.findOne({ where: { name } });
  if (existingProduct) {
    return next(new AppError("Product already exists", 400));
  }
 
  const uploaded = await processUploadFilesToSave(req, req.files, req.body);
  const images = uploaded.images && uploaded.images.length > 0
  ? uploaded.images.map(img => ({
      fileName: img.fileName || '',
      fileType: img.fileType || '',
      url: img.url || '',
      uploadDate: img.uploadDate ? new Date(img.uploadDate).toISOString() : new Date().toISOString()
    }))
  : [];

console.log('Images to save:', JSON.stringify(images));
console.log('Profile Image to save:', images);


  const newProduct = await Product.create({
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
    images:images,
    isActive: isActive ?? true
    
  });

  // Return success response
  res.status(200).json({
    status: 1,
    message: 'Product Created successfully.',
    product: newProduct,
  });

});

// exports.getAllUsers = catchAsync(async (req, res, next) => {
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

// exports.sendEmailMessages = catchAsync(async (req, res, next) => {
//   const { emailList, subject, message } = req.body;

//   if (!subject && !message) {
//     return next(new AppError('Subject and message are required', 400));
//   }

//   if (emailList && !Array.isArray(emailList)) {
//     return next(new AppError('emailList must be an array', 400));
//   }

//   let users;

//   if (emailList && emailList.length > 0) {
//     const validEmails = emailList.filter(email => validator.isEmail(email));
//     if (validEmails.length === 0) {
//       return next(new AppError('No valid email addresses found in the provided list', 400));
//     }

//     users = await User.findAll({
//       where: {email: {[Op.in]: validEmails}},
//       attributes: ['email', 'name'],
//       order: [['createdAt', 'ASC']]
//     });
//   } else {
//     users = await User.findAll({
//       where: {email: {[Op.ne]: null}},
//       attributes: ['email', 'name'],
//       order: [['createdAt', 'ASC']]
//     });
//   }

//   if (!users || users.length === 0) {
//     return next(new AppError('No users found with valid email addresses', 404));
//   }

//   const emailPromises = users.map(user => {
//     const emailSubject = subject || 'Welcome to Our Platform, Grand Technology System!';
//     const emailMessage = message
//       ? `Dear ${user.name},\n\n${message}`
//       : `Hi ${user.name},\n\nWelcome to Our Platform! We're excited to have you on board.\n\nPlease use the following link to access our platform:\n- Login Link: ${
//           process.env.NODE_ENV === 'development' ? 'http://localhost:8085' : 'https://grandinventory.com'
//         }\n\nIf you have any questions or need assistance, feel free to contact our support team.\n\nBest regards,\nThe Inventory Team`;

//     return sendEmail({ email: user.email, subject: emailSubject, message: emailMessage });
//   });

//   try {
//     await Promise.all(emailPromises);
//     res.status(200).json({
//       status: 1,
//       message: 'Emails sent successfully to users with valid emails.',
//     });
//   } catch (error) {
//     console.error('Error sending emails:', error);
//     return next(new AppError('Failed to send one or more emails', 500));
//   }
// });



