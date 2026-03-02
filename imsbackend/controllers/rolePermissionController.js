const { RolePermission, Role, Permission } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { where } = require('sequelize');
const rolePermissions = require('../models/rolePermissions');

const getBusinessId = () => 1;

exports.assignPermissionsToRole = catchAsync(async (req, res, next) => {
  console.log("roleId and Permissionids",req.params,req.body)

  const roleId=req.params.roleId
  const {permissionIds } = req.body;

  if (!roleId || !Array.isArray(permissionIds)) {
    return next(new AppError('roleId and permissionIds[] are required', 400));
  }

  const role = await Role.findByPk(roleId);
  if (!role)   return next(new AppError('Role not found', 404));
  
  await RolePermission.destroy({ where: { roleId } });// Remove existing permissions (SYNC behavior)
  const mappings = permissionIds.map(permissionId => ({
    roleId,
    permissionId
  }));//Create new mappings

   console.log("rolePermissions",mappings)

  await RolePermission.bulkCreate(mappings);

  res.status(200).json({
    error:false,
    status: 1,
    message: `Permissions assigned to role ${role.code} successfully`,
  });
});

exports.getRolePermissions = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;
   const role = await Role.findByPk(roleId);
  if (!role)  return next(new AppError('Role not found', 404));

  const permissions = await RolePermission.findAll({
    where: { roleId },
    include: [
      { model: Permission, as: 'permission', attributes: ['id', 'key', 'module','description'] }
    ]
  });

  res.status(200).json({
    error:false,
    status: 1,
    message:`Permissions fetched succeffully for role ${role.code}`,
    result:permissions.length,
    data: permissions
  });
});

exports.removePermissionFromRole = catchAsync(async (req, res, next) => {
  const roleId = req.params.roleId;
  const { permissionIds } = req.body;

  if (!roleId || !Array.isArray(permissionIds) || permissionIds.length === 0) {
    return next(
      new AppError('roleId and non-empty permissionIds[] are required', 400)
    );
  }

  const deleted = await RolePermission.destroy({
    where: {
      roleId,
      permissionId: {[Op.in]: permissionIds},
    },
  });

  if (!deleted)  return next(new AppError('No matching permissions found for this role', 404));
  
  res.status(200).json({
    status: 1,
    message: `${deleted} permission(s) removed from role`,
  });
});

exports.clearRolePermissions = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;

  await RolePermission.destroy({ where: { roleId } });

  res.status(200).json({
    status: 1,
    message: 'All permissions removed from role'
  });
});