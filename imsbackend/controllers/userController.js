const { Op, where } = require('sequelize');
const Sequelize=require("sequelize")

const xlsx = require('xlsx'); //for import user from excel
const ExcelJS = require("exceljs");

const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const validator = require('validator');
const { User, Role, Warehouse } = require('../models');
const fs = require('fs');
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils");
const { sendEmail } = require('../utils/emailUtils');

const {createMulterMiddleware,processUploadFilesToSave,importFromExcelFile,exportToExcelFile,exportToPDFFile} = require('../utils/fileUtils');

// Configure multer for payment file uploads
const userUpload = createMulterMiddleware(
  'uploads/users/',
  'user',
  [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
);

// Middleware for handling multiple file 
exports.uploaduserAttachements=userUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])
exports.uploaduserFile = userUpload.single('file');// Middleware for handling single file upload

const buildUserWhereClause = (query) => {
  const { isActive,search, warehouseId, roleId, startDate, endDate } = query;

  let whereClause = {};

  if (warehouseId) whereClause.warehouseId = warehouseId;
  if (roleId) whereClause.roleId = roleId;

  if (isActive !== undefined) {
    whereClause.isActive = ["true", "1", true, 1].includes(isActive);
  }

  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  if (search) {
    whereQuery[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phoneNumber: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereClause;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const {sortBy,sortOrder, page = 1,limit = 20} = req.query;

  const whereQuery = buildUserWhereClause(req.query);
  const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  // Pagination
  const offset = (page - 1) * limit;

  const { rows: users, count: totalFiltered } = await User.findAndCountAll({
    where: whereQuery,
    include: [
      { model: Role, as: 'role', attributes: ['id', 'code'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
    ],
    offset: Number(offset),
    limit: Number(limit),
    order: [[orderColumn, orderDirection]],
  });

  if (users.length === 0) {
    return next(new AppError("No users found", 404));
  }

const formattedUsers = users.map(u => {
  const { profileImage,password,passwordResetOTP,changePassword,createdAt,updatedAt,...rest } = u.toJSON();
           
  return {
    ...rest,
    formattedCreatedAt: u.createdAt ? formatDate(u.createdAt) : null,
    formattedUpdatedAt: u.updatedAt ? formatDate(u.updatedAt) : null,
    roleName: u.role?.name,
    warehouseName: u.warehouse?.name,
  };
});

  // After fetching users
const roleCounts = {};
formattedUsers.forEach(u => {
  const roleName = u.role?.code || 'Unknown';
  if (!roleCounts[roleName]) roleCounts[roleName] = 0;
  roleCounts[roleName]++;
});

const activeUsers = users.filter(u => u.isActive).length;
const inactiveUsers = users.filter(u => !u.isActive).length;

res.status(200).json({
    status: 1,
    message: "Users fetched successfully",
    length:  totalFiltered,//formattedUsers.length,
    currentPage:Number(page),
    limit: Number(limit),
    activeUsers,
    inactiveUsers,
    totalPages:Math.ceil(totalFiltered / limit),
    roleCounts,
    users: formattedUsers,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {

  console.log("Requested User Role:", req.user.role,req.params);

  const user = await User.findByPk(req.params.userId, {
    include: [
      { model: Role, as: 'role' },
      { model: Warehouse, as: 'warehouse' }
    ]
  });


  if (!user)  return next(new AppError('User not foundn', 404));

  const { password,passwordResetOTP,passwordResetOTPExpires,...safeUser } = user.toJSON();

  res.status(200).json({
    status: 1,
    message: `Profile fetched successfully!`,
    data: safeUser
  });
});

exports.updateUser= catchAsync(async (req, res, next) => {

  const user = await User.findByPk(req.params.userId);
  if (!user)  return next(new AppError("User not found", 404));
  
  const originalUserData = JSON.parse(JSON.stringify(user));
  
  let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, user)
  if(!profileImage) profileImage=user.profileImage
  // Process uploads
  
  // Merge update fields
  const updateData = {...req.body, profileImage  };

  await user.update(updateData);

  const { password,passwordResetOTP,passwordResetOTPExpires,...safeUser } = user.toJSON();

  // // Log update
  // await logAction({
  //   model: 'users',
  //   action: 'Update',
  //   actor: req.user?.id || 'system',
  //   description: 'User profile updated',
  //   data: {
  //     userId: updatedUser.id,
  //     beforeUpdate: originalUserData,
  //     updatedData: updateData,
  //   },
  //   ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
  //   severity: 'info',
  //   sessionId: req.session?.id || 'generated-session-id',
  // });

  res.status(200).json({
    error:false,
    status: 1,
    message: `${user.fullName} updated successfully`,
    updatedUser:safeUser,   
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {

 const user = await User.findByPk(req.params.userId, {
    include: [
      { model: Role, as: 'role' },
      { model: Warehouse, as: 'warehouse' }
    ]
  });
  console.log("reseted user", user);

  if (!user)  return next(new AppError('User is not found', 404));

  const randomPassword = user.generateRandomPassword();
 // user.password = await bcrypt.hash(randomPassword, 12);
 user.password = randomPassword;
  // console.log("password", randomPassword)
  user.changePassword = true;
  await user.save();
console.log("rested user",user)
  // If the user has no email, send response and return
  if (!user.email) {
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role.code,
      resetedPassword: randomPassword,
      message: 'Password reset successfully. The password will be provided by the admin. Please contact support.',
      changePassword: user.changePassword,
    });
  }

  try {
    // Send email to user
    const subject = 'Your Password Has Been Reset';
    const email = user.email;
    console.log("reqq user",req.user)
    const loginLink = process.env.NODE_ENV === "development" ? "http://localhost:8083" : "https://grandinventory.com";
    const message = `Hi ${user.fullName},
    
        Your password has been reset by an ${req.user.fullName} with role ${req.user.roleCode}. Here are your new login credentials:

      - phoneNumber: ${user.phoneNumber}
      - Email: ${user.email}
      - Temporary Password: ${randomPassword}

      Please log in and change your password immediately.

      -Login Link: ${loginLink}

      If you did not request this change, please contact our support team.

      Best regards,
      Smart Inventory Managment System Group Team`;

    await sendEmail({ email, subject, message });

    // Return response after email is sent
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role.code,
      resetedPassword: randomPassword,
      message: `Password for ${user.fullName} reset successfully by ${req.user.fullName} with role ${req.user.roleCode}.Check email-${user.email} for details.`,
      changePassword: user.changePassword,
    });

  } catch (error) {
    console.log(error);
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.updateUserStatus = catchAsync(async (req, res, next) => { 
  const userId = req.params.userId;
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User is not found', 404));
  }
  user.isActive = !user.isActive;
  await user.save();
  res.status(200).json({
    status: 1,
    message: `${user.fullName} is ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    // user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = parseInt(req.params.userId, 10); // ensure it's an integer

  const deletedCount = await User.destroy({ where: { id: userId } });

  if (deletedCount === 0) {
    return next(new AppError("User entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

exports.deleteUsers = catchAsync(async (req, res, next) => {
  const deletedCount = await User.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    return next(new AppError("No user entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    message: `${deletedCount} users deleted`,
  });
});

exports.sendEmailMessages = catchAsync(async (req, res, next) => {
  const { emailList, subject, message } = req.body;

  if (!subject && !message) {
    return next(new AppError('Subject and message are required', 400));
  }

  if (emailList && !Array.isArray(emailList)) {
    return next(new AppError('emailList must be an array', 400));
  }

  let users;

  if (emailList && emailList.length > 0) {
    const validEmails = emailList.filter(email => validator.isEmail(email));
    if (validEmails.length === 0) {
      return next(new AppError('No valid email addresses found in the provided list', 400));
    }

    users = await User.findAll({
      where: {email: {[Op.in]: validEmails}},
      attributes: ['email', 'name'],
      order: [['createdAt', 'ASC']]
    });
  } else {
    users = await User.findAll({
      where: {email: {[Op.ne]: null}},
      attributes: ['email', 'name'],
      order: [['createdAt', 'ASC']]
    });
  }

  if (!users || users.length === 0) {
    return next(new AppError('No users found with valid email addresses', 404));
  }

  const emailPromises = users.map(user => {
    const emailSubject = subject || 'Welcome to Our Platform, Grand Technology System!';
    const emailMessage = message
      ? `Dear ${user.name},\n\n${message}`
      : `Hi ${user.name},\n\nWelcome to Our Platform! We're excited to have you on board.\n\nPlease use the following link to access our platform:\n- Login Link: ${
          process.env.NODE_ENV === 'development' ? 'http://localhost:8085' : 'https://grandinventory.com'
        }\n\nIf you have any questions or need assistance, feel free to contact our support team.\n\nBest regards,\nThe Inventory Team`;

    return sendEmail({ email: user.email, subject: emailSubject, message: emailMessage });
  });

  try {
    await Promise.all(emailPromises);
    res.status(200).json({
      status: 1,
      message: 'Emails sent successfully to users with valid emails.',
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return next(new AppError('Failed to send one or more emails', 500));
  }
});

exports.importUsers = catchAsync(async (req, res, next) => {
  if (!req.file || !req.file.path) {
    return next(new AppError('File not uploaded or path is invalid.', 400));
  }

  // Only allow Excel files
  if (!req.file.mimetype.includes('spreadsheetml') && !req.file.originalname.endsWith('.xlsx')) {
    return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
  }

  const requiredFields = [
    'businessId', 'warehouseId', 'roleId',
    'fullName', 'phoneNumber', 'email', 'password',
    'isActive', 'address'
  ];

  // Transform each row before saving
  const transformFn = async (row) => ({
    businessId: row.businessId,
    warehouseId: row.warehouseId,
    roleId: row.roleId,
    fullName: row.fullName,
    phoneNumber: String(row.phoneNumber),
    email: String(row.email).toLowerCase(),
    password: String(row.password),
    isActive: Boolean(row.isActive),
    address: row.address,
    profileImage: null
  });

  const saveFn = async (data) => await User.create(data);

  const { importedData, errors } = await importFromExcelFile({
    filePath: req.file.path,
    requiredFields,
    transformFn,
    saveFn
  });

  if (!importedData.length) {
    return next(new AppError('No valid Users were imported from the file.', 400));
  }

  res.status(200).json({
    status: 1,
    message: errors.length > 0 ? 'Import completed with some errors' : 'Data imported successfully',
    successCount: importedData.length,
    errorCount: errors.length,
    errors,
    importedUsers: importedData
  });
});

exports.exportUsers = catchAsync(async (req, res, next) => {
  const { sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 1000 } = req.query;

  const whereQuery = buildUserWhereClause(req.query);

  const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  const users = await User.findAll({
    where: whereQuery,
    include: [
      { model: Role, as: "role", attributes: ["id", "name"] },
      { model: Warehouse, as: "warehouse", attributes: ["id", "name"] }
    ],
    order: [[orderColumn, orderDirection]],
    limit: Number(limit),
    offset: (page - 1) * limit
  });

  if (!users.length) {
    return next(new AppError("No users found for the given filters.", 404));
  }

  // Format users for export
  const formattedUsers = users.map(u => ({
    ID: u.id,
    "Full Name": u.fullName,
    Email: u.email,
    Phone: u.phoneNumber,
    Role: u.role?.name || "N/A",
    Warehouse: u.warehouse?.name || "N/A",
    Active: u.isActive ? "Yes" : "No"
  }));

  // Define columns for Excel
  const columns = Object.keys(formattedUsers[0]).map(key => ({
    header: key,
    key,
    width: 20
  }));

  // Call generic Excel export
  await exportToExcelFile({
    data: formattedUsers,
    columns,
    fileName: "users",
    res
  });
});

exports.getUserDashboardSummary = catchAsync(async (req, res, next) => {

  const { isActive, warehouseId, roleId, startDate, endDate } = req.query;

  let whereClause = {};

  if (warehouseId) whereClause.warehouseId = warehouseId;
  if (roleId) whereClause.roleId = roleId;

  if (isActive !== undefined) {
    whereClause.isActive = ["true", "1", true, 1].includes(isActive);
  }

  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    mustChangePassword,
    usersPerWarehouseRaw,
    usersPerRoleRaw
  ] = await Promise.all([
    User.count({ where: whereClause }),
    User.count({ where: { ...whereClause, isActive: true } }),
    User.count({ where: { ...whereClause, isActive: false } }),
    User.count({ where: { ...whereClause, changePassword: true } }),
    // Users per Warehouse
    User.findAll({
      attributes: [
        'warehouseId',
        [Sequelize.fn('COUNT', Sequelize.col('User.id')), 'totalUsers']
      ],
      where: whereClause,
      include: [{
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name']
      }],
      group: ['warehouseId', 'warehouse.id']
    }),
    // Users per Role
    User.findAll({
      attributes: [
        'roleId',
        [Sequelize.fn('COUNT', Sequelize.col('User.id')), 'totalUsers']
      ],
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name']
      }],
      group: ['roleId', 'role.id']
    })

  ]);

  // ---------- FORMAT CLEAN RESPONSE ----------
  const usersPerWarehouse = usersPerWarehouseRaw.map(item => ({
    warehouseId: item.warehouseId,
    warehouseName: item.warehouse?.name || "Unknown",
    totalUsers: Number(item.get('totalUsers'))
  }));

  const usersPerRole = usersPerRoleRaw.map(item => ({
    roleId: item.roleId,
    roleName: item.role?.name || "Unknown",
    totalUsers: Number(item.get('totalUsers'))
  }));

  res.status(200).json({
    status: 1,
    message: "User dashboard summary fetched successfully",
    totalUsers,
    activeUsers,
    inactiveUsers,
    mustChangePassword,
    usersPerWarehouse,
    usersPerRole
  });

});