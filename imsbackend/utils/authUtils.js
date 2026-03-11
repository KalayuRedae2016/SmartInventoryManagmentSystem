const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const catchAsync = require('./catchAsync');
const { User, Role, Permission,UserPermission,RolePermission } = require('../models');
const { decode } = require('punycode');

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
    try { return JSON.parse(permissions); } catch { return []; }
  }
  return [];
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleCode)) {
      return next(new AppError('Access denied', 403));
    }
    next();
  };
};

exports.requirePermission = (requiredPermissions, options = { mode: 'any' }) => {
  return (req, res, next) => {
    console.log("req.user",req.user.roleCode)
    if (!req.user) {
      return res.status(401).json({ status: 0, message: 'Authorization data missing' });
    }

    // ✅ Owner or SuperAdmin bypass
    if (req.user.roleCode=== 'owner' || req.user.roleCode === 'superAdmin') {
      return next();
    }

    // Normalize permissions
    const permissions = normalizePermissions(req.user.permissions);
    console.log('User permissions:', permissions);

    // Super admin full wildcard bypass
    if (permissions.includes("*")) return next();

    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    const hasAccess = options.mode === 'all'
      ? required.every(p => permissions.includes(p))
      : required.some(p => permissions.includes(p));

    if (!hasAccess) {
      return res.status(403).json({ status: 0, message: 'Insufficient permissions' });
    }

    next();
  };
};

exports.requirePermissionOrSelf = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.id === Number(req.params.id)) return next();

    // Owner bypass
    if (req.user.roleCode === 'owner' || req.user.roleCode === 'superAdmin') return next();

    const permissions = normalizePermissions(req.user.permissions);

    if (permissions.includes('*')) return next();

    if (!permissions.includes(permission)) return next(new AppError('Insufficient permissions', 403));

    next();
  };
};

exports.authenticationJwt = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization &&req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token)  return next(new AppError('Not logged in', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //for non access control comment the ffing and use decode.id=1
    //if (!token)  return next(new AppError('Not logged in', 401));
    //const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load user with Role + RolePermissions + UserPermissions
    const user = await User.findByPk(decoded.id,//1,
       {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        },
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: ['granted'] }
        }
      ]
    });
    // console.log("user::",user)

    if (!user || !user.role)   return next(new AppError('User no longer exists', 401));
    if (!user.isActive) {
      return next(new AppError('User is inactive', 403));
    }

    const rolePermissions =user.role.permissions?.map(p => p.key) || [];
    const userGrantedPermissions =user.permissions?.filter(p => p.UserPermission?.granted === true).map(p => p.key) || [];
    const userRevokedPermissions =user.permissions?.filter(p => p.UserPermission?.granted === false).map(p => p.key) || [];
    let mergedPermissions = [...new Set([...rolePermissions, ...userGrantedPermissions])];
    mergedPermissions = mergedPermissions.filter(p => !userRevokedPermissions.includes(p));


    req.user = {
      id: user.id,
      businessId: user.businessId,
      warehouseId: user.warehouseId,
      fullName:user.fullName,
      roleId: user.roleId,
      roleCode: user.role.code,
      // rolePermissions:rolePermissions,
      // userGrantedPermissions,
      // userRevokedPermissions,
      permissions: mergedPermissions
    };

    console.log("authenticated User",req.user)
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};