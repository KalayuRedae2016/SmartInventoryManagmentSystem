const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const catchAsync = require('./catchAsync');
const { User, Role, Permission } = require('../models');

require('dotenv').config();


exports.VerifyToken = (req, res, next) => {
  const token = req.headers['token'];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Authentication token missing'
    });
  }

  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch {
    return res.status(403).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }

  if (!decoded?.bankName) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token payload'
    });
  }

  const BANK_SECRET_KEYS = {
    LIB: 'LIB123456789',
    WEGAGEB: 'WEGAGEn123456789',
    CBE: 'CBE123456789'
  };

  const secretKey = BANK_SECRET_KEYS[decoded.bankName.toUpperCase()];

  if (!secretKey) {
    return res.status(403).json({
      success: false,
      message: `Unsupported bank type: ${decoded.bankName}`
    });
  }

  jwt.verify(token, secretKey, { algorithms: ['HS256'] }, (err, verified) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token verification failed',
        error: err.message
      });
    }

    req.bankAuth = verified;
    next();
  });
};

exports.generateCode = async ({
  model,
  prefix,
  businessId,
  transaction = null
}) => {
  const lastRecord = await model.findOne({
    where: {
      tenant_id: businessId,
      code: { [Op.like]: `${prefix}%` }
    },
    order: [['createdAt', 'DESC']],
    attributes: ['code'],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  let nextNumber = 1;

  if (lastRecord?.code) {
    const parsed = parseInt(lastRecord.code.replace(prefix, ''), 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

const normalizePermissions = (permissions) => {
  if (!permissions) return [];

  if (Array.isArray(permissions)) return permissions;

  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }

  return [];
};

exports.requirePermission = (requiredPermissions, options = { mode: 'any' }) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 0,
        message: 'Authorization data missing'
      });
    }
    // const permissions = normalizePermissions(req.user.role?.permissions);
    const permissions = normalizePermissions(req.user.permissions);
    console.log('User permissions:', permissions);

    // Super admin
    if (permissions.includes("*")) return next();

    const required = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasAccess =options.mode === 'all'
        ? required.every(p => permissions.includes(p))
        : required.some(p => permissions.includes(p));

    if (!hasAccess) {
      return res.status(403).json({
        status: 0,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

exports.requirePermissionOrSelf = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.id === Number(req.params.id)) {
      return next();
    }

    const permissions = normalizePermissions(req.user?.role?.permissions);

    if (permissions.includes('*')) return next();

    if (!permissions.includes(permission)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

exports.authenticationJwt = async (req, res, next) => {
  let token;

  if (req.headers.authorization &&req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('Not logged in', 401));

  // console.log('Received token:', token);
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findByPk(decoded.id, {
    include: { model: Role,as: 'role' }
  });

  if (!user || !user.role) {
    return next(new AppError('User no longer exists', 401));
  }
  console.log('Authenticated user:',user.fullName, 'with role:', user.role.code,'and Permissions:', user.role.permissions);

  req.user = {
    id: user.id,
    businessId: user.businessId,
    roleId: user.roleId,
    roleCode: user.role.code,
    permissions: user.role.permissions || []
  };

  next();
};

