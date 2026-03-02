'use strict';

const {Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op, fn, col } = require('sequelize');

const getBusinessId = () => 1;

exports.createPermission = catchAsync(async (req, res, next) => {
  console.log("requeste Permission Body",req.body)
  const { name, key, module, description } = req.body;
  if (!name || !key || !module) {
    return next(new AppError('name, key, and module are required', 400));
  }

  const existingPermission = await Permission.findOne({
    where: { businessId: getBusinessId(), key }
  });
  if (existingPermission) return next(new AppError('Permission with same key already exists', 409));

  const permission = await Permission.create({
    businessId:getBusinessId(),
    name,
    key,
    module,
    description,
    isActive: true
  });

  res.status(200).json({
    status: 1,
    message: 'Permission created successfully',
    data: permission
  });
});

exports.getPermissions = catchAsync(async (req, res, next) => {
  const { module, search, isActive, groupByModule } = req.query;
 
  const whereClause = {
    businessId: req.user.businessId
  };

  if (module) {
    whereClause.module = module;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { key: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const permissions = await Permission.findAll({ 
    where: whereClause,
    limit: +limit,
    offset: +offset
 });

  // 🔥 OPTIONAL: Group only if requested
  if (groupByModule === 'true') {
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return res.status(200).json({
      status: 1,
      result: permissions.length,
      total: permissions.count,
      currentPage: +page,
      totalPages: Math.ceil(permissions.count / limit),
      data: grouped
    });
  }


  // Default normal list
  res.status(200).json({
    status: 1,
    result: permissions.length,
    total: permissions.count,
    currentPage: +page,
    totalPages: Math.ceil(permissions.count / limit),
    data: permissions
  });
});

exports.getPermission = catchAsync(async (req, res, next) => {
  const permission = await Permission.findOne({
    where: { businessId: getBusinessId(), id: req.params.permissionId }
  });
  if (!permission) return next(new AppError('Permission not found', 404));
  res.status(200).json({ 
    error:false,
    status: 1,
    message:"permission fetched succeffully",
    data: permission 
  });
});

exports.updatePermission = catchAsync(async (req, res, next) => {
  const permission = await Permission.findOne({
    where: { businessId: getBusinessId(), id: req.params.permissionId }
  });
  if (!permission) return next(new AppError('Permission not found', 404));
  
  // console.log("existing permissions",permission)
  // console.log("requested Body",req.body)

  await permission.update(req.body);
  res.status(200).json({
    error:false,
    status: 1,
    message: 'Permission updated successfully',
    data: permission
  });
});

exports.deletePermission = catchAsync(async (req, res, next) => {
  const permission = await Permission.findOne({
    where: { businessId: req.user.businessId, id: req.params.permissionId }
  });
  if (!permission) return next(new AppError('Permission not found', 404));

  await permission.destroy();
  res.status(200).json({
    error:false,
    status: 1,
    message: 'Permission deleted successfully',
    data:[]
  });
});

exports.togglePermissionStatus = catchAsync(async (req, res, next) => {
  const permission = await Permission.findOne({
    where: { businessId: getBusinessId(), id: req.params.permissionId }
  });

  if (!permission) return next(new AppError('Permission not found', 404));

  permission.isActive = !permission.isActive;
  await permission.save();

  res.status(200).json({
    status: 1,
    message: `Permission ${permission.isActive ? 'activated' : 'deactivated'} successfully`,
    data: permission
  });
});

exports.deleteAllPermission = catchAsync(async (req, res, next) => {
  const permission = await Permission.findAll({
    where: { businessId: getBusinessId}
  });
  if (!permission) return next(new AppError('Permission not found', 404));

console.log("permissions to be deleted",permission)
  //await permission.destroy();
  res.status(200).json({
    error:false,
    status: 1,
    message: 'Permissions deleted successfully',
    data:[]
  });
});

exports.getPermissionAdvancedSummary = catchAsync(async (req, res, next) => {

  const businessId = req.user.businessId;

  // 🔹 Basic totals
  const totalPermissions = await Permission.count({
    where: { businessId }
  });

  const activePermissions = await Permission.count({
    where: { businessId, isActive: true }
  });

  const inactivePermissions = await Permission.count({
    where: { businessId, isActive: false }
  });

  // 🔹 Group by module with counts
  const moduleStats = await Permission.findAll({
    attributes: [
      'module',
      [fn('COUNT', col('id')), 'total']
    ],
    where: { businessId },
    group: ['module'],
    raw: true
  });

  // 🔹 Recently created (last 5)
  const recentPermissions = await Permission.findAll({
    where: { businessId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'name', 'key', 'module', 'createdAt']
  });

  // 🔹 Percentage calculation
  const activePercentage = totalPermissions
    ? ((activePermissions / totalPermissions) * 100).toFixed(2)
    : 0;

  const inactivePercentage = totalPermissions
    ? ((inactivePermissions / totalPermissions) * 100).toFixed(2)
    : 0;

  res.status(200).json({
    status: 1,
    data: {
      totals: {
        totalPermissions,
        activePermissions,
        inactivePermissions,
        activePercentage,
        inactivePercentage
      },
      moduleDistribution: moduleStats,
      recentPermissions
    }
  });

});