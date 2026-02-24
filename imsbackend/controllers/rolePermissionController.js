const { RolePermission, Role, Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.assignPermissionsToRole = catchAsync(async (req, res, next) => {
  const { roleId, permissionIds } = req.body;
  if (!roleId || !Array.isArray(permissionIds)) return next(new AppError('roleId and permissionIds required', 400));
  const role = await Role.findOne({ where: { id: roleId, businessId: req.user.businessId } });
  if (!role) return next(new AppError('Role not found', 404));
  const rolePermissions = permissionIds.map(pid => ({ roleId, permissionId: pid }));
  await RolePermission.bulkCreate(rolePermissions, { ignoreDuplicates: true });
  res.status(200).json({ status: 1, message: 'Permissions assigned to role' });
});

exports.getRolePermissions = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;
  const role = await Role.findOne({ where: { id: roleId, businessId: req.user.businessId }, include: [{ model: Permission, as: 'permissions' }] });
  if (!role) return next(new AppError('Role not found', 404));
  res.status(200).json({ status: 1, data: role.permissions });
});

exports.removePermissionFromRole = catchAsync(async (req, res, next) => {
  const { roleId, permissionId } = req.body;
  if (!roleId || !permissionId) return next(new AppError('roleId and permissionId required', 400));
  const deleted = await RolePermission.destroy({ where: { roleId, permissionId } });
  if (!deleted) return next(new AppError('Permission not found for role', 404));
  res.status(200).json({ status: 1, message: 'Permission removed from role' });
});