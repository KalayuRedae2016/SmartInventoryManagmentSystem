'use strict';

const {Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
  const permissions = await Permission.findAll({ where: { businessId: getBusinessId() } });
  res.status(200).json({
    error:false,
    status: 1,
    message:"permissions fetuched succeffully",
    result:permissions.length,
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
    where: { businessId: getBusinessId, id: req.params.permissionId }
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
// exports.deleteAllPermission = catchAsync(async (req, res, next) => {
//   const permission = await Permission.findAll({
//     where: { businessId: getBusinessId}
//   });
//   if (!permission) return next(new AppError('Permission not found', 404));

// console.log("permissions to be deleted",permission)
//   //await permission.destroy();
//   res.status(200).json({
//     error:false,
//     status: 1,
//     message: 'Permissions deleted successfully',
//     data:[]
//   });
// });