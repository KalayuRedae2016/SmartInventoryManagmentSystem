const { RolePermission, Role, Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

// Assign permissions to a role
exports.assignPermissionsToRole = catchAsync(async (req, res, next) => {
  const { roleId, permissionIds } = req.body;
  console.log("roleId and Permissionids",req.body)

  if (!roleId || !Array.isArray(permissionIds)) {
    return next(new AppError('roleId and permissionIds[] are required', 400));
  }
  // 1️⃣ Make sure role exists
  const role = await Role.findByPk(roleId);
  if (!role) {
    return next(new AppError('Role not found', 404));
  }

  // 2️⃣ Remove existing permissions (SYNC behavior)
  await RolePermission.destroy({ where: { roleId } });

  // 3️⃣ Create new mappings
  const mappings = permissionIds.map(permissionId => ({
    roleId,
    permissionId
  }));

  await RolePermission.bulkCreate(mappings);

  res.status(200).json({
    error:false,
    status: 1,
    message: 'Permissions assigned to role successfully'
  });
});

// Get permissions of a role
exports.getRolePermissions = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;

  const permissions = await RolePermission.findAll({
    where: { roleId },
    include: [
      { model: Permission, as: 'permission', attributes: ['id', 'key', 'description'] }
    ]
  });

  res.status(200).json({
    status: 1,
    data: permissions
  });
});

// Remove a permission from a role
exports.removePermissionFromRole = catchAsync(async (req, res, next) => {
  const { roleId, permissionId } = req.body;

  if (!roleId || !permissionId) {
    return next(new AppError('roleId and permissionId are required', 400));
  }

  const deleted = await RolePermission.destroy({
    where: { roleId, permissionId }
  });

  if (!deleted) {
    return next(new AppError('RolePermission not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Permission removed from role'
  });
});

// Delete all permissions of a role
exports.clearRolePermissions = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;

  await RolePermission.destroy({ where: { roleId } });

  res.status(200).json({
    status: 1,
    message: 'All permissions removed from role'
  });
});