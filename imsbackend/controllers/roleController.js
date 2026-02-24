'use strict';

const { Role, Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { syncMasterPermissions } = require('../services/permissionService');

function toCode(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePermissionIds(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(id => Number(id)).filter(Number.isFinite);
  return [Number(input)].filter(Number.isFinite);
}

function isOwnerName(name) {
  return String(name || '').trim().toLowerCase() === 'owner';
}

function mapRoleResponse(role) {
  const permissionItems = Array.isArray(role.permissionItems) ? role.permissionItems : [];
  const permissionKeys =
    permissionItems.length
      ? permissionItems.map(item => item.key)
      : Array.isArray(role.permissions)
        ? role.permissions
        : [];
  return {
    id: role.id,
    businessId: role.businessId,
    name: role.name,
    code: role.code,
    description: role.description,
    isActive: role.isActive,
    permissionIds: permissionItems.map(item => item.id),
    permissions: permissionKeys
  };
}

async function findRoleByPkSafe(roleId) {
  try {
    return await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissionItems', attributes: ['id', 'key', 'name'] }]
    });
  } catch {
    return Role.findByPk(roleId);
  }
}

async function findAllRolesSafe(businessId) {
  try {
    return await Role.findAll({
      where: { businessId },
      include: [{ model: Permission, as: 'permissionItems', attributes: ['id', 'key', 'name'] }],
      order: [['id', 'ASC']]
    });
  } catch {
    return Role.findAll({
      where: { businessId },
      order: [['id', 'ASC']]
    });
  }
}

async function resolvePermissionSelection(permissionIds, roleName) {
  const allPermissions = await syncMasterPermissions();
  if (isOwnerName(roleName)) return allPermissions;

  const selectedIds = normalizePermissionIds(permissionIds);
  if (!selectedIds.length) return [];

  const selected = allPermissions.filter(item => selectedIds.includes(item.id));
  if (selected.length !== selectedIds.length) {
    throw new AppError('Some selected permissions are invalid', 400);
  }
  return selected;
}

exports.createRole = catchAsync(async (req, res, next) => {
  const { businessId, name, permissionIds, description, isActive } = req.body;
  if (!businessId || !name) {
    return next(new AppError('Please provide required fields: businessId and name', 400));
  }

  const roleName = String(name || '').trim();
  const roleCode = toCode(roleName);
  if (!roleCode) return next(new AppError('Role name is invalid', 400));

  const existingRole = await Role.findOne({ where: { businessId, code: roleCode } });
  if (existingRole) {
    return next(new AppError('Role with same name already exists in this business', 409));
  }

  const selectedPermissions = await resolvePermissionSelection(permissionIds, roleName);
  const role = await Role.create({
    businessId,
    name: roleName,
    code: roleCode,
    permissions: selectedPermissions.map(item => item.key),
    description,
    isActive
  });

  try {
    await role.setPermissionItems(selectedPermissions.map(item => item.id));
  } catch (error) {
    console.error('RolePermissions join unavailable, permissions kept in JSON only:', error.message);
  }
  const createdRole = await findRoleByPkSafe(role.id);

  res.status(200).json({
    status: 1,
    message: 'Role created successfully',
    data: mapRoleResponse(createdRole)
  });
});

exports.getAllRoles = catchAsync(async (req, res, next) => {
  const businessId = Number(req.query.businessId || req.user?.businessId || 1);
  const roles = await findAllRolesSafe(businessId);

  res.status(200).json({
    status: 1,
    results: roles.length,
    data: roles.map(mapRoleResponse)
  });
});

exports.getRoleById = catchAsync(async (req, res, next) => {
  const role = await findRoleByPkSafe(req.params.roleId);

  if (!role) return next(new AppError('Role not found', 404));

  res.status(200).json({
    status: 1,
    data: mapRoleResponse(role)
  });
});

exports.updateRole = catchAsync(async (req, res, next) => {
  const role = await findRoleByPkSafe(req.params.roleId);
  if (!role) return next(new AppError('Role not found', 404));

  const nextName = req.body.name !== undefined ? String(req.body.name || '').trim() : role.name;
  if (!nextName) return next(new AppError('Role name cannot be empty', 400));

  const nextCode = toCode(nextName);
  const conflict = await Role.findOne({
    where: { businessId: role.businessId, code: nextCode }
  });
  if (conflict && conflict.id !== role.id) {
    return next(new AppError('Another role with same name exists', 409));
  }

  const selectedPermissions = isOwnerName(nextName)
    ? await syncMasterPermissions()
    : req.body.permissionIds !== undefined
      ? await resolvePermissionSelection(req.body.permissionIds, nextName)
      : Array.isArray(role.permissionItems)
        ? role.permissionItems
        : [];

  const selectedPermissionKeys = selectedPermissions.map(item => item.key).filter(Boolean);

  await role.update({
    name: nextName,
    code: nextCode,
    description: req.body.description !== undefined ? req.body.description : role.description,
    isActive: req.body.isActive !== undefined ? req.body.isActive : role.isActive,
    permissions: selectedPermissionKeys
  });
  try {
    await role.setPermissionItems(selectedPermissions.map(item => item.id));
  } catch (error) {
    console.error('RolePermissions join unavailable, permissions kept in JSON only:', error.message);
  }

  const updated = await findRoleByPkSafe(role.id);

  res.status(200).json({
    status: 1,
    message: 'Role updated successfully',
    data: mapRoleResponse(updated)
  });
});

exports.deleteRole = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return next(new AppError('Role not found', 404));

  await role.update({ isActive: false });

  res.status(200).json({
    status: 1,
    message: 'Role deactivated successfully'
  });
});

exports.changeRoleStatus = catchAsync(async (req, res, next) => {
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return next(new AppError('Role not found', 404));

  role.isActive = !role.isActive;
  await role.save();

  res.status(200).json({
    status: 1,
    message: `Role is now ${role.isActive ? 'active' : 'inactive'}`,
    data: role
  });
});
