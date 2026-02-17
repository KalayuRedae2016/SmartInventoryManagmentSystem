const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const User = db.User;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils");
const { sendEmail } = require('../utils/emailUtils');

const {createMulterMiddleware,processUploadFilesToSave,importFromExcel,exportToExcel,exportToPdf} = require('../utils/fileUtils');

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

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { isActive, search, sortBy, sortOrder, page = 1, limit = 20 } = req.query;
  let whereQuery = {};
  if (!req.user.role==="admin") {
    whereQuery = { role: req.user.role };
  } 

  // isActive Filter
  if (isActive !== undefined) {
    whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
  }

  // Search Filter (name, email, phone)
  if (search) {
    whereQuery[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phoneNumber: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
      { role: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  // Pagination
  const skip = (page - 1) * limit;

  // 4️FETCH USERS (PAGINATED + FILTERED)
  const { rows: users, count: totalFiltered } = await User.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  if (users.length === 0) {
    return next(new AppError("No users found", 404));
  }


  const formattedUsers = users.map(u => ({
    ...u.toJSON(),
    formattedCreatedAt: u.createdAt ? formatDate(u.createdAt) : null,
    formattedUpdatedAt: u.updatedAt ? formatDate(u.updatedAt) : null,
  }));

  // // 6️ FAST SQL COUNTERS FOR DASHBOARD
  // const [
  //   activeUsers,
  //   deactiveUsers,
  //   activeStaffs,
  //   deactiveStaffs,
  //   adminUsers,
  // ] = await Promise.all([
  //   User.count({ where: { role: "user", isActive: true } }),
  //   User.count({ where: { role: "user", isActive: false } }),
  //   User.count({ where: { role: "staff", isActive: true } }),
  //   User.count({ where: { role: "staff", isActive: false } }),
  //   User.count({ where: { role: "admin" } }),
  // ]);

  // 7️⃣ SEND RESPONSE
  res.status(200).json({
    status: 1,
    length: formattedUsers.length,
    message: 'Users fetched successfully',
    // pagination: {
    //   totalFiltered,
    //   currentPage: Number(page),
    //   limit: Number(limit),
    //   totalPages: Math.ceil(totalFiltered / limit),
    // },
    // counts: {
    //   activeUsers,
    //   deactiveUsers,
    //   activeStaffs,
    //   deactiveStaffs,
    //   adminUsers,
    // },
    users: formattedUsers,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  let userId = req.params.userId; // default: self-access

  // Admins can access any user
  if (req.user.role === "admin") {
    userId = req.params.userId;
  }

  // Doctors can access- their own data, users' (patients') data,not other doctors/admins
  if (req.user.role === "staff") {
    const targetUserId = req.params.userId;
    if (targetUserId && targetUserId !== req.user.id) {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser) {
        return next(new AppError('User not found', 404));
      }

      // Doctors can only view users (patients), not other doctors or admins
      if (targetUser.role !== "user") {
        return next(new AppError("Access denied: You can only view profiles.", 403));
      }

      userId = targetUserId;
    }
  }

  // Normal users can only view their own data (already set above)
  const user = await User.findByPk(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const formattedCreatedAt = user.createdAt ? formatDate(user.createdAt) : null;
  const formattedUpdatedAt = user.updatedAt ? formatDate(user.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `Profile fetched successfully!`,
    data: {
      ...user.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateUser= catchAsync(async (req, res, next) => {
  const targetUserId = req.params.userId;

  // Role-based access control
  if (req.user.role === 'user' && req.user.id !== targetUserId) {
    return next(new AppError("Access denied: You can only update your own profile", 403));
  }

  if (req.user.role === 'doctor') {
    if (req.user.id !== targetUserId) {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser || targetUser.role !== 'user') {
        return next(new AppError("Access denied: Doctors can only update their own or user (patient) profiles", 403));
      }
    }
  }

  const existingUser = await User.findByPk(targetUserId);
  if (!existingUser) {
    return next(new AppError("User not found", 404));
  }

  const originalUserData = JSON.parse(JSON.stringify(existingUser));
  
  let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, existingUser)
  if(!profileImage){
    profileImage=existingUser.profileImage
  }
  // Process uploads
  
  // Merge update fields
  const updateData = {
    ...req.body,
    profileImage
  };

  // Update user
  await existingUser.update(updateData);

  // Fetch latest version
  const updatedUser = await User.findByPk(targetUserId);

  // Format timestamps
  const formattedCreatedAt = updatedUser.createdAt ? formatDate(updatedUser.createdAt) : null;
  const formattedUpdatedAt = updatedUser.updatedAt ? formatDate(updatedUser.updatedAt) : null;

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
    status: 1,
    message: `${updatedUser.fullName} updated successfully`,
    updatedUser: {
      ...updatedUser.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findByPk(userId);
  console.log("reseted user", user);

  if (!user) {
    return next(new AppError('User is not found', 404));
  }

  // Generate a new password and update the user
  const randomPassword = user.generateRandomPassword();
  user.password = await bcrypt.hash(randomPassword, 12);
  console.log("password", randomPassword)
  user.changePassword = true;
  await user.save();

  // If the user has no email, send response and return
  if (!user.email) {
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role,
      resetedPassword: randomPassword,
      message: 'Password reset successfully. The password will be provided by the admin. Please contact support.',
      changePassword: user.changePassword,
    });
  }

  try {
    // Send email to user
    const subject = 'Your Password Has Been Reset';
    const email = user.email;
    const loginLink = process.env.NODE_ENV === "development" ? "http://localhost:8085" : "https://grandinventory.com";
    const message = `Hi ${user.name},

        Your password has been reset by an administrator. Here are your new login credentials:

      - phoneNumber: ${user.phoneNumber}
      - Email: ${user.email}
      - Temporary Password: ${randomPassword}

      Please log in and change your password immediately.

      -Login Link: ${loginLink}

      If you did not request this change, please contact our support team.

      Best regards,
      Mobile Veternary Services Group Team`;

    await sendEmail({ email, subject, message });

    // Return response after email is sent
    return res.status(200).json({
      status: 1,
      userId: user.id,
      role: user.role,
      resetedPassword: randomPassword,
      message: 'Password reset successfully. Check your email for details.',
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
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user,
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

exports.importUsersFromExcel = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  } 
  const filePath = req.file.path;
  const { processExcelFile } = require('../utils/excelUtils');
  const { validUsers, invalidEntries } = await processExcelFile(filePath);  
  if (validUsers.length > 0) {
    await User.bulkCreate(validUsers);
  } 

  res.status(200).json({
    status: 1,
    message: `${validUsers.length} users imported successfully. ${invalidEntries.length} invalid entries were skipped.`,
    invalidEntries,
})
});

exports.exportUsersToExcel = catchAsync(async (req, res, next) => { 
  const users = await User.findAll({
    attributes: ['id', 'fullName', 'email', 'phoneNumber', 'address', 'role', 'isActive', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });
  const filePath = await exportToExcel(users, 'Users');
  res.status(200).json({
    status: 1,
    message: 'Users exported to Excel successfully',
    filePath,
  });
});

exports.exportUsersToPdf = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ['id', 'fullName', 'email', 'phoneNumber', 'address', 'role', 'isActive', 'createdAt'], 
    order: [['createdAt', 'ASC']]
  });
  const filePath = await exportToPdf(users, 'Users');
  res.status(200).json({
    status: 1,
    message: 'Users exported to PDF successfully',
    filePath,
  });
});
