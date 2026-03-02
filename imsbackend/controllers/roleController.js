'use strict';

const { Role, User, Permission, Warehouse } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const allowedUpdateFields = ['name', 'code', 'description', 'isActive'];

exports.createRole = catchAsync(async (req, res, next) => {
  const { warehouseId, name, code, description } = req.body;

  if (!warehouseId || !name || !code) {
    return next(new AppError('warehouseId, name and code are required', 400));
  }

  const existingRole = await Role.findOne({
    where: {
      businessId: req.user.businessId,
      warehouseId,
      code
    }
  });

  if (existingRole) {
    return next(new AppError('Role code already exists in this warehouse', 409));
  }

  const role = await Role.create({
    businessId: req.user.businessId,
    warehouseId,
    name,
    code,
    description,
    isActive: true
  });

  res.status(201).json({
    status: 1,
    message: 'Role created successfully',
    data: role
  });
});

exports.getRoles = catchAsync(async (req, res, next) => {
  const { warehouseId, search, isActive } = req.query;

  const whereClause = {
    businessId: req.user.businessId
  };

  if (warehouseId) whereClause.warehouseId = warehouseId;

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const roles = await Role.findAll({
    where: whereClause,
    include: [
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
    ]
  });

  res.status(200).json({
    status: 1,
    results: roles.length,
    data: roles
  });
});

exports.getRole = catchAsync(async (req, res, next) => {
  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    },
    include: [
      { model: Permission, as: 'permissions', through: { attributes: [] } },
      { model: Warehouse, as: 'warehouse' },
    ]
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 1,
    data: role
  });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    }
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  const filteredBody = {};
  allowedUpdateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  await role.update(filteredBody);

  res.status(200).json({
    status: 1,
    message: 'Role updated successfully',
    data: role
  });
});

exports.deleteRole = catchAsync(async (req, res, next) => {
  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    }
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  role.isActive = false;
  await role.save();

  res.status(200).json({
    status: 1,
    message: 'Role deactivated successfully'
  });
});

exports.changeUsersToRole = catchAsync(async (req, res, next) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds)) {
    return next(new AppError('userIds must be an array', 400));
  }

  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    }
  });

  if (!role) return next(new AppError('Role not found', 404));
  if (!role.isActive) return next(new AppError('Role is inactive', 400));

  await User.update(
    { roleId: role.id },
    {
      where: {
        id: { [Op.in]: userIds },
        businessId: req.user.businessId
      }
    }
  );

  res.status(200).json({
    error:false,
    status: 1,
    message: `Users assigned to role ${role.code}successfully`
  });
});

exports.getUsersByRole = catchAsync(async (req, res, next) => {
  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    },
    include: [
      { model: User, as: 'users', attributes: ['id', 'fullName', 'email'] }
    ]
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 1,
    role: role.code,
    users: role.users
  });
});

exports.getWarehousesByRole = catchAsync(async (req, res, next) => {

  const role = await Role.findOne({
    where: {
      id: req.params.roleId,
      businessId: req.user.businessId
    },
    include: [
      {
        model: Warehouse,
        as: 'warehouse',  
        attributes: ['id', 'name', 'location']
      }
    ]
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 1,
    role: role.code,
    warehouse: role.warehouse  
  });
});

exports.getRoleSummary = catchAsync(async (req, res, next) => {

  const roles = await Role.findAll({
    where: { businessId: req.user.businessId },
    include: [
      { model: User, as: 'users', attributes: ['id'] },
      { model: Permission, as: 'permissions', through: { attributes: [] } },
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }
    ]
  });

const activeroles = roles.filter(r => r.isActive).length;
const inactiveroles = roles.filter(r => !r.isActive).length;

  const summary = roles.map(role => ({
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    isActive: role.isActive,
    totalUsers: role.users?.length || 0,
    totalPermissions: role.permissions?.length || 0,
    warehouseId: role.warehouse?.id || null,
    warehouseName: role.warehouse?.name || null
  }));

  res.status(200).json({
    status: 1,
    totalRoles: roles.length,
    activeroles,
    inactiveroles,
    data: summary
  });
});