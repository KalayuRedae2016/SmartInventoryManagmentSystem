const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { Op, where } = require('sequelize');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();

//console.log("Loading model: ", db);
const { sendEmail, sendWelcomeEmail } = require('../utils/emailUtils');
// const {logAction}=require("../utils/logUtils")
//const { deleteFile, createMulterMiddleware, processUploadFilesToSave } = require('../utils/fileUtils');
const { deleteFile, createMulterMiddleware, processUploadFilesToSave } = require('../utils/fileUtils');
const path = require('path');
const { formatDate } = require('../utils/dateUtils');
const { permission } = require('process');
const role = require('../models/role');

const signInToken = (user) => {
  const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

//attachements=documents and images
const attachments = createMulterMiddleware(
  'uploads/documents', // Destination folder
  'doc', // Prefix for filenames
  ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'] // Allowed types
);


exports.uploadFilesMiddleware = attachments.fields([
  { name: 'profileImage', maxCount: 1 },// Single file for profileImage
  { name: 'images', maxCount: 10 }, // upto to 10 images
  { name: 'documents', maxCount: 10 }, // Up to 10 files for documents
]);

// Signup controller
exports.signup = catchAsync(async (req, res, next) => {
  console.log("registration request", req.body)
  console.log("profileImages", req.files)
  const { fullName, phoneNumber, password, email, address} = req.body;
  if (!fullName || !phoneNumber || !password) {
    return next(new AppError("missing required Fields(name,phone or password)", 404))
  }
  // if (role=== "staff") {
  //   if (!licenseNumber || !education || !specialization) {
  //     return next(new AppError("Missing requred filds for Physician or Admin"))
  //   }
  // }

  let { profileImage, documents } = await processUploadFilesToSave(req, req.files, req.body)
  if(!profileImage){
  profileImage=`${req.protocol}://${req.get('host')}/uploads/default.png`;// full URL to default image
  }

  console.log("User model:", User === undefined ? "Not loaded" : "Loaded");
console.log("Testing table access...");
try {
  const test = await User.findAll({ limit: 1 });
  console.log("Table exists, sample row:", test);
} catch (err) {
  console.error("Table access error:", err);
}

  const existingUser = await User.findOne({ where: { phoneNumber } });
  if (existingUser) {
    if (req.files) deleteFile(req.files.path);
    return (next(new AppError("PhoneNumber already in use", 404)))
  }

  
  // const hashedPassword = await bcrypt.hash(password, 12);// Hash password see on hooks

  const newUser = await User.create({
    businessId: 1, // Default businessId, adjust as needed
    roleId:1,
    fullName,
    phoneNumber,
    email,
    address,
    password,
    profileImage: profileImage,
  });
  //await logAction
  await sendWelcomeEmail(newUser, password)

  // Return success response
  res.status(200).json({
    message: 'User registered successfully.',
    data: newUser,
  });

});

exports.login = catchAsync(async (req, res, next) => {
  const { phoneNumber, password } = req.body;
  console.log("Request body:", req.body);

  // Input validation
  if (!phoneNumber) return next(new AppError("Please provide valid phone number", 404));
  if (!password) return next(new AppError("Please provide valid password", 404));

  // Find user by email
  const user = await User.findOne({ 
    where: { phoneNumber } ,
    include: { model: Role,as: 'role' } 
  });
  
  if (!user) {
    return next(new AppError("Invalid credentials. Please try again or reset your password", 401));
  }

  // Compare password
  const correct = await bcrypt.compare(password, user.password);
  if (!correct) return next(new AppError("Invalid or incorrect password", 404));

  const token = signInToken(user);
  //console.log("LoggedInUser",user)
  res.status(200).json({
    status: 1,
    token,
    user,
    role: user.role ? user.role.code : null,
    permissions: user.role ? user.role.permissions : [],
    changePassword: user.changePassword,
    message: user.changePassword
      ? 'Login successful, but you must change your password.'
      : 'Login successful.',
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  console.log("requested body", req.body)
  const { email } = req.body
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('There is no User with the email', 404));
  }
  // console.log(user)

  const resetOTPCode = user.createPasswordResetOTP()
  await user.save();
  console.log("resetOtpCode", resetOTPCode)

  try {
    const email = user.email;
    const subject = 'Password Reset Verification Code';
    const message = `Your OTP code for password reset is: ${resetOTPCode}.\nIt will expire in 10 minutes.\nIf you didn't request this, please ignore the message.`;
    console.log(email, subject, message)

    await sendEmail({ email, subject, message });
    res.status(200).json({
      status: 1,
      passwordResetOTP: resetOTPCode,
      message: 'Reset token Sent to Email Succeffully',
    });
  } catch (err) {
    //console.log(err);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();

    return next(
      new AppError('There was an error sending the email. Try again later!'), 500);
  }
});
exports.verifyOTP = catchAsync(async (req, res, next) => {
  console.log("Incoming body:", req.body);

  const { email, passwordResetOTP } = req.body;
  if (!email || !passwordResetOTP) {
    return next(new AppError('Email and OTP code are required.', 400));
  }

  const user = await User.findOne({
    where: { email, passwordResetOTP, passwordResetOTPExpires: { [Op.gt]: new Date() } }
  });

  console.log("user", user)
  if (!user) {
    return next(new AppError('Invalid or expired OTP code.', 404));
  }

  user.passwordResetOTP = null;
  user.passwordResetOTPExpires = null;
  await user.save();

  res.status(200).json({
    status: 1,
    message: 'OTP Verified successfully. Proceed to reset password.'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("Incoming body:", req.body);
  const { email, newPassword } = req.body

  const user = await User.findOne({ where: { email: email } });
  if (!user) {
    return next(new AppError('User is not found.', 404));
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedNewPassword;
  await user.save();

  const token = signInToken(user);
console.log("userrr", user)
  res.status(200).json({
    status: 1,
    user: user,
    userId: user.id,
    role: user.role,
    token: token,
    message: "Password Reseted Succeffully",
  })
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  console.log("requested body", req.body)
  // console.log("requestUsers", req.user)
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const correct = await bcrypt.compare(currentPassword, user.password);
  if (!correct)   return res.status(401).json({ message: 'Incorrect current password' });
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  //const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = newPassword
  user.changePassword = false
  await user.save();

  res.status(200).json({
    status: 1,
    message: 'Password updated successfully'
  });

});

exports.getMe = catchAsync(async (req, res, next) => {
  console.log("requestUser", req.user)
  const user=await User.findByPk(req.user.id,{
    attributes: { exclude: ['password','passwordResetOTP','passwordResetOTPExpires'] }
  })

  if(!user) return next(new AppError("No user Found",404))
  res.status(200).json({
    status: 1,
    message: "get my Profile succefully",
    data:user
  });
})
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log("requestUser", req.user)
  console.log("request body", req.body)

  if (req.body.password || req.body.role || req.body.roleId) {
    return next(new AppError('This route is not for password or role updates', 400));
  }

  const user=await User.findByPk(req.user.id)
  if(!user) return next(new AppError("No user Found",404))
    
  const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

  const filteredBody = filterObj(
    req.body,
    'fullName',
    'phoneNumber',
    'email',
    'address'
  );

  // Step 5: Handle profile image upload
  if (req.files && req.files.profileImage) {
    let {profileImage}= await processUploadFilesToSave(req,req.files, req.body, existingUser)
  if(!profileImage){
    profileImage=existingUser.profileImage
  }
  filteredBody.profileImage = profileImage;
}

  await user.update(filteredBody, { where: { id: req.user.id } }, { new: true, runValidators: true });

  await user.save();

  res.status(200).json({
    status: 1,
    message: "user Updated Sucessfully",
    data:user
  });

});


