'use strict';

const { Role,Us } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { search, get } = require('../routes/roleRoutes');

// const getBusinessId = () => 1;

exports.createRole = catchAsync(async (req, res, next) => {
  console.log("requeted Body:",req.body);
  const {name,code,permissions,description}=req.body;

  if(!name || !code){
    return next(new AppError('role name and code are required', 400));
  }
  const existingRole = await Role.findOne({ where: { businessId: req.user.businessId, code } });
  if (existingRole) {
    return next(new AppError('Role with the same code already exists', 409));
  }

  const role = await Role.create({
    businessId: req.user.businessId,
    name,
    code,
    permissions: Array.isArray(permissions) ? permissions : [],
    description,
    isActive: true
  });

  res.status(200).json({
    status: 1,
    message: 'Role created successfully',
    data: role
  });
});

exports.getRoles = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const whereClause = { businessId: req.user.businessId };
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  const roles = await Role.findAll({ where: whereClause });

  res.status(200).json({
    status: 1,
    results: roles.length,
    data: roles
  });
});

exports.getRole = catchAsync(async (req, res, next) => {
  const roleId = Number(req.params.roleId);
  
  if (isNaN(roleId)) {
    return next(new AppError('Invalid role ID', 400));
  }

  const role = await Role.findByPk(req.params.roleId);

  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  res.status(200).json({
    status: 1,
    data: role,
    permissions: role.permissions || []
  });
});
exports.getUsersByRole = catchAsync(async (req, res, next) => {
  const roleId = Number(req.params.roleId);
  console.log("Fetching users for role ID:", roleId);
  if (isNaN(roleId)) {
    return next(new AppError('Invalid role ID', 400));
  }
  const role = await Role.findByPk(roleId, {
    include: { model: User, as: 'users' }
  });

  if (!role) {
    return next(new AppError('Role not found', 404));
  }
  res.status(200).json({
    status: 1,
    data: role.users
  });
});

exports.assignUsersToRole = catchAsync(async (req, res, next) => {
  const roleId = Number(req.params.roleId);
  const { userIds } = req.body;

  console.log(`Assigning users ${userIds} to role ID ${roleId}`);
  if (isNaN(roleId)) {
    return next(new AppError('Invalid role ID', 400));
  } 
  if (!Array.isArray(userIds)) {
    return next(new AppError('userIds must be an array', 400));
  }
  const role = await Role.findByPk(roleId);
  if (!role) {
    return next(new AppError('Role not found', 404));
  }
  await User.update({ roleId }, { where: { id: userIds } });

  res.status(200).json({
    status: 1,
    message: 'Users assigned to role successfully',
    data: { roleId, userIds }
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

  await role.destroy();

  res.status(200).json({
    status: 1,
    message: 'Role deleted successfully'
  });
});

exports.deleteRoles = catchAsync(async (req, res, next) => {
  await Role.destroy({ where: { businessId: req.user.businessId } });

  res.status(200).json({
    status: 1,
    message: 'All roles deleted successfully'
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
