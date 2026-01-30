'use strict';

const { Role } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.createRole = catchAsync(async (req, res, next) => {
  console.log("requeted Body:",req.body);
  const {businessId,name,code,permissions,description,isActive}=req.body;
  if(!businessId || !name || !code || !permissions){
    return next(new AppError('Please provide all required fields: businessId, name, code, permissions', 400));
  }
  const existingRole = await Role.findOne({ where: { businessId, code } });
  if (existingRole) {
    return next(new AppError('Role with the same code already exists in this business', 409));
  }

  const role = await Role.create({
    businessId,
    name,
    code,
    permissions,
    description,
    isActive
  });

  res.status(200).json({
    status: 1,
    message: 'Role created successfully',
    data: role
  });
});

exports.getAllRoles = catchAsync(async (req, res, next) => {
  const roles = await Role.findAll();

  res.status(200).json({
    status: 1,
    results: roles.length,
    data: roles
  });
});

exports.getRoleById = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 1,
    data: role
  });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  await role.update(req.body);

  res.status(200).json({
    status: 1,
    message: 'Role updated successfully',
    data: role
  });
});

exports.deleteRole = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  await role.update({ isActive: false });

  res.status(200).json({
    status: 1,
    message: 'Role deactivated successfully'
  });
});

exports.changeRoleStatus = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  role.isActive = !role.isActive;
  await role.save();

  res.status(200).json({
    status: 1,
    message: 'Role status updated',
    message: `Role is now ${role.isActive ? 'active' : 'inactive'}`,
    data: role
  });
});
