const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { Op, where } = require('sequelize');
<<<<<<< HEAD
const User = db.User;
const Role = db.Role;
const Permission = db.Permission;
const { syncMasterPermissions } = require('../services/permissionService');
=======
>>>>>>> e45eb45bfd377bd620806eb526ec7b9a84b779bc

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
  const payload = { id: user.id, roleId: user.roleId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

function normalizePermissions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePermissionKeys(value) {
  return normalizePermissions(value).map(item => String(item).trim()).filter(Boolean);
}

function isOwnerRole(role) {
  if (!role) return false;
  const code = String(role.code || '').toUpperCase();
  const name = String(role.name || '').toLowerCase();
  return code === 'OWNER' || name === 'owner';
}

function buildRolePayload(role) {
  if (!role) return null;
  return {
    id: role.id,
    name: role.name,
    code: role.code
  };
}

function buildRolePermissions(role) {
  if (!role) return [];
  const fromRelation = Array.isArray(role.permissionItems)
    ? role.permissionItems.map(item => item.key).filter(Boolean)
    : [];
  const fromLegacy = normalizePermissionKeys(role.permissions);
  const merged = Array.from(new Set([...fromRelation, ...fromLegacy]));
  return merged;
}

function buildEffectivePermissions(user, role) {
  const rolePermissions = buildRolePermissions(role);
  const addSet = new Set(normalizePermissionKeys(user?.permissionAdds));
  const removeSet = new Set(normalizePermissionKeys(user?.permissionRemoves));

  const effective = rolePermissions
    .filter(permission => !removeSet.has(permission))
    .concat(Array.from(addSet))
    .filter(Boolean);

  const normalized = Array.from(new Set(effective));
  if (isOwnerRole(role)) {
    // Keep owner full-access explicit for guard compatibility.
    return Array.from(new Set(['*', ...normalized]));
  }
  return normalized;
}

function buildSafeUser(user, rolePayload) {
  return {
    id: user.id,
    businessId: user.businessId,
    roleId: user.roleId,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    profileImage: user.profileImage,
    address: user.address,
    isActive: user.isActive,
    changePassword: user.changePassword,
    permissionAdds: normalizePermissionKeys(user.permissionAdds),
    permissionRemoves: normalizePermissionKeys(user.permissionRemoves),
    role: rolePayload
  };
}

function toCode(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parsePermissionIds(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(value => Number(value)).filter(Number.isFinite);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(value => Number(value)).filter(Number.isFinite);
      return [];
    } catch {
      return input
        .split(',')
        .map(value => Number(value.trim()))
        .filter(Number.isFinite);
    }
  }
  return [];
}

async function resolveSignupRole({ businessId, roleId, roleName, permissionIds }) {
  const normalizedRoleId = Number(roleId || 0);
  if (normalizedRoleId) {
    const selectedRole = await Role.findByPk(normalizedRoleId);
    if (!selectedRole) throw new AppError('Selected role does not exist', 400);
    return selectedRole.id;
  }

  const normalizedName = String(roleName || '').trim();
  if (!normalizedName) {
    const defaultRole = await Role.findOne({
      where: { businessId, isActive: true },
      order: [['id', 'ASC']]
    });
    if (!defaultRole) throw new AppError('No active role found. Create a role first.', 400);
    return defaultRole.id;
  }

  const roleCode = toCode(normalizedName);
  if (!roleCode) throw new AppError('Invalid role name', 400);

  const existingRole = await Role.findOne({ where: { businessId, code: roleCode } });
  if (existingRole) return existingRole.id;

  const masterPermissions = await syncMasterPermissions();
  const selectedIds = parsePermissionIds(permissionIds);
  const isOwner = normalizedName.toLowerCase() === 'owner';
  const selectedPermissionItems = isOwner
    ? masterPermissions
    : masterPermissions.filter(item => selectedIds.includes(item.id));

  const role = await Role.create({
    businessId,
    name: normalizedName,
    code: roleCode,
    permissions: selectedPermissionItems.map(item => item.key),
    isActive: true
  });

  // Best effort: works when RolePermissions table exists.
  if (typeof role.setPermissionItems === 'function') {
    try {
      await role.setPermissionItems(selectedPermissionItems.map(item => item.id));
    } catch (error) {
      console.error('RolePermissions join not ready yet, saved legacy permissions JSON only:', error.message);
    }
  }

  return role.id;
}

async function resolveUserPermissionOverrides({ role, selectedPermissionIds }) {
  const rolePermissions = buildRolePermissions(role);
  const rolePermissionSet = new Set(rolePermissions);
  const masterPermissions = await syncMasterPermissions();

  const requestedIds = parsePermissionIds(selectedPermissionIds);
  if (!requestedIds.length) {
    return { permissionAdds: [], permissionRemoves: [] };
  }

  const requestedKeys = masterPermissions
    .filter(item => requestedIds.includes(item.id))
    .map(item => item.key);
  const requestedSet = new Set(requestedKeys);

  const permissionAdds = requestedKeys.filter(permission => !rolePermissionSet.has(permission));
  const permissionRemoves = rolePermissions.filter(permission => !requestedSet.has(permission));

  return {
    permissionAdds: Array.from(new Set(permissionAdds)),
    permissionRemoves: Array.from(new Set(permissionRemoves))
  };
}

const roleIncludeWithPermissions = [
  {
    model: Role,
    as: 'role',
    attributes: ['id', 'name', 'code', 'permissions'],
    include: [{ model: Permission, as: 'permissionItems', attributes: ['id', 'key', 'name'] }]
  }
];

const roleIncludeFallback = [
  {
    model: Role,
    as: 'role',
    attributes: ['id', 'name', 'code', 'permissions']
  }
];

async function findUserWithRoleByPhone(phoneNumber) {
  try {
    return await User.findOne({
      where: { phoneNumber },
      include: roleIncludeWithPermissions
    });
  } catch (error) {
    console.error('Role-permission join unavailable, falling back to Role.permissions JSON:', error.message);
    return User.findOne({
      where: { phoneNumber },
      include: roleIncludeFallback
    });
  }
}

async function findUserWithRoleById(userId, attributes) {
  const query = {};
  if (attributes) query.attributes = attributes;

  try {
    return await User.findByPk(userId, {
      ...query,
      include: roleIncludeWithPermissions
    });
  } catch (error) {
    console.error('Role-permission join unavailable, falling back to Role.permissions JSON:', error.message);
    return User.findByPk(userId, {
      ...query,
      include: roleIncludeFallback
    });
  }
}

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
  const { fullName, phoneNumber, password, email, address, roleId, roleName, permissionIds } = req.body;
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

  const resolvedRoleId = await resolveSignupRole({
    businessId: 1,
    roleId,
    roleName,
    permissionIds
  });

  const resolvedRole = await Role.findByPk(resolvedRoleId, {
    include: [{ model: Permission, as: 'permissionItems', attributes: ['id', 'key', 'name'] }]
  });
  if (!resolvedRole) return next(new AppError('Assigned role not found', 400));

  const { permissionAdds, permissionRemoves } = await resolveUserPermissionOverrides({
    role: resolvedRole,
    selectedPermissionIds: permissionIds
  });

  const newUser = await User.create({
    businessId: 1, // Default businessId, adjust as needed
    roleId: resolvedRoleId,
    fullName,
    phoneNumber,
    email,
    address,
    password,
    profileImage: profileImage,
    permissionAdds,
    permissionRemoves
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
<<<<<<< HEAD
  const user = await findUserWithRoleByPhone(phoneNumber);
  // console.log("Found user:", user.dataValues)

=======
  const user = await User.findOne({ 
    where: { phoneNumber } ,
    include: { model: Role,as: 'role' } 
  });
  
>>>>>>> e45eb45bfd377bd620806eb526ec7b9a84b779bc
  if (!user) {
    return next(new AppError("Invalid credentials. Please try again or reset your password", 401));
  }

  // Compare password
  const correct = await bcrypt.compare(password, user.password);
  if (!correct) return next(new AppError("Invalid or incorrect password", 404));

  const token = signInToken(user);
  const rolePayload = buildRolePayload(user.role);
  const permissions = buildEffectivePermissions(user, user.role);
  const safeUser = buildSafeUser(user, rolePayload);

  res.status(200).json({
    status: 1,
    token,
<<<<<<< HEAD
    user: safeUser,
    role: rolePayload,
    permissions,
=======
    user,
    role: user.role ? user.role.code : null,
    permissions: user.role ? user.role.permissions : [],
>>>>>>> e45eb45bfd377bd620806eb526ec7b9a84b779bc
    changePassword: user.changePassword,
    message: user.changePassword
      ? 'Login successful, but you must change your password.'
      : 'Login successful.',
  });
});

<<<<<<< HEAD
exports.authenticationJwt = catchAsync(async (req, _, next) => {
  let token;
  if (req.headers.authorization &&req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Unauthorized: No token provided', 401));
  }
  console.log("tokenn",token)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decode",decoded)
  } catch (err) {
    console.error('❌ Invalid or expired JWT:', err.message);
    return next(new AppError('Session expired or invalid token', 401));
  }

  const user = await findUserWithRoleById(decoded.id);
  if (!user) {
    console.warn('⚠️ User not found for ID:', decoded.id);
    return next(new AppError('The user belonging to this token no longer exists', 404));
  }

  req.user = user;
  console.log("Authenticated user:", req.user);
  next();
});

exports.requiredRole = (...allowedRoles) => {
  console.log("allowedRoles", allowedRoles)
  return async (req, res, next) => {
    const userRole = req.user?.role?.code || req.user?.role?.name || req.user?.role;
    console.log("Logged-in role:", userRole);

    const normalizedAllowed = allowedRoles.map(role => String(role).toLowerCase());
    if (!normalizedAllowed.includes(String(userRole || '').toLowerCase())) {
      return next(new AppError('Access Denied', 403));
    }

    next();
  };
};

=======
>>>>>>> e45eb45bfd377bd620806eb526ec7b9a84b779bc
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
  const user = await findUserWithRoleById(req.user.id, {
    exclude: ['password', 'passwordResetOTP', 'passwordResetOTPExpires']
  })

  if(!user) return next(new AppError("No user Found",404))
  const rolePayload = buildRolePayload(user.role);
  const permissions = buildEffectivePermissions(user, user.role);
  const safeUser = buildSafeUser(user, rolePayload);

  res.status(200).json({
    status: 1,
    message: "get my Profile succefully",
    data: safeUser,
    user: safeUser,
    role: rolePayload,
    permissions
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


